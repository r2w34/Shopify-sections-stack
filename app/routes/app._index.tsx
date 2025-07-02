"use client"

import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react"
import { authenticate } from "../shopify.server"
import fs from "fs/promises"
import path from "path"
import {
  Page,
  Layout,
  Card,
  FormLayout,
  Select,
  Button,
  Banner,
  Text,
  List,
  Collapsible,
  TextContainer,
  InlineStack,
  Badge,
  Divider,
  CalloutCard,
  BlockStack,
} from "@shopify/polaris"
import { useState } from "react"

// === Types ===
interface Theme {
  id: string
  name: string
  role: string
}

interface ActionData {
  success?: boolean
  message?: string
  error?: string
}

// === Loader ===
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin } = await authenticate.admin(request)

    // Fetch themes via GraphQL
    const response = await admin.graphql(`
      {
        themes(first: 50) {
          edges {
            node {
              id
              name
              role
              createdAt
              updatedAt
            }
          }
        }
      }
    `)

    const jsonData = (await response.json()) as any

    if (jsonData.errors) {
      console.error("GraphQL errors:", jsonData.errors)
      throw new Error(`GraphQL Error: ${JSON.stringify(jsonData.errors)}`)
    }

    const themes = jsonData.data.themes.edges.map((edge: any) => edge.node)
    console.log("Loaded themes:", themes)

    // Read local section files from app/sections
    // Fix: Use process.cwd() for more reliable path resolution
    const sectionsDir = path.join(process.cwd(), "app", "sections")
    console.log("Looking for sections in:", sectionsDir)

    let sectionFiles: string[] = []
    try {
      // Check if directory exists first
      await fs.access(sectionsDir)
      const files = await fs.readdir(sectionsDir)
      sectionFiles = files.filter((file) => file.endsWith(".liquid"))
      console.log("Found section files:", sectionFiles)
    } catch (err) {
      console.warn("Sections directory not found or empty:", err)
      // Create the directory if it doesn't exist
      try {
        await fs.mkdir(sectionsDir, { recursive: true })
        console.log("Created sections directory:", sectionsDir)
      } catch (createErr) {
        console.error("Failed to create sections directory:", createErr)
      }
    }

    return json({ themes, sectionFiles, sectionsDir })
  } catch (error) {
    console.error("Loader error:", error)
    throw new Response("Failed to load themes and sections", { status: 500 })
  }
}

// === Action ===
export async function action({ request }: ActionFunctionArgs) {
  console.log("=== Action started ===")

  try {
    const formData = await request.formData()
    const sectionName = formData.get("section")
    const themeId = formData.get("themeId")
    const themeName = formData.get("themeName")

    console.log("Form data received:", { sectionName, themeId, themeName })

    // Validation
    if (typeof sectionName !== "string" || typeof themeId !== "string") {
      console.error("Missing required fields")
      return json<ActionData>(
        {
          error: "Missing required fields: section name and theme ID are required",
        },
        { status: 400 },
      )
    }

    // Fix: More flexible validation - allow selection of .liquid files
    if (!sectionName || sectionName === "") {
      return json<ActionData>(
        {
          error: "Please select a section file",
        },
        { status: 400 },
      )
    }

    if (!sectionName.endsWith(".liquid")) {
      console.error("Invalid file extension")
      return json<ActionData>(
        {
          error: "Invalid section file: must be a .liquid file",
        },
        { status: 400 },
      )
    }

    const { admin, session } = await authenticate.admin(request)

    if (!session) {
      console.error("No session found")
      return json<ActionData>(
        {
          error: "Authentication failed: user session not found",
        },
        { status: 401 },
      )
    }

    console.log("Session info:", { shop: session.shop, hasAccessToken: !!session.accessToken })

    // Fix: Use consistent path resolution
    const filePath = path.join(process.cwd(), "app", "sections", sectionName)
    console.log("Reading file from:", filePath)

    let content: string
    try {
      content = await fs.readFile(filePath, "utf-8")
      console.log(`Successfully read section file: ${sectionName}, length: ${content.length}`)
    } catch (err) {
      console.error(`Failed to read section file: ${sectionName}`, err)
      return json<ActionData>(
        {
          error: `Section file not found: ${sectionName}. Make sure the file exists in app/sections/`,
        },
        { status: 404 },
      )
    }

    if (!content.trim()) {
      console.error("Section file is empty")
      return json<ActionData>(
        {
          error: "Section file is empty",
        },
        { status: 400 },
      )
    }

    const mutation = `
      mutation themeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
        themeFilesUpsert(themeId: $themeId, files: $files) {
          upsertedThemeFiles {
            filename
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const variables = {
      themeId: themeId,
      files: [
        {
          filename: `sections/${sectionName}`,
          body: {
            type: "TEXT",
            value: content,
          },
        },
      ],
    }

    console.log("Uploading via GraphQL themeFilesUpsert:", {
      themeId,
      filename: `sections/${sectionName}`,
      contentLength: content.length,
    })

    const response = await admin.graphql(mutation, { variables })
    const responseData = (await response.json()) as any

    console.log("GraphQL response:", JSON.stringify(responseData, null, 2))

    if (responseData.errors) {
      console.error("GraphQL errors:", responseData.errors)
      return json<ActionData>(
        {
          error: `GraphQL Error: ${JSON.stringify(responseData.errors)}`,
        },
        { status: 400 },
      )
    }

    const { upsertedThemeFiles, userErrors } = responseData.data.themeFilesUpsert

    if (userErrors && userErrors.length > 0) {
      console.error("User errors:", userErrors)
      return json<ActionData>(
        {
          error: `Upload errors: ${JSON.stringify(userErrors)}`,
        },
        { status: 400 },
      )
    }

    console.log("Section file uploaded successfully:", upsertedThemeFiles)

    return json<ActionData>({
      success: true,
      message: `Successfully uploaded "${sectionName}" to "${themeName || "theme"}"`,
    })
  } catch (error) {
    console.error("Action error:", error)
    return json<ActionData>(
      {
        error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

// === UI Component ===
export default function ThemesPage() {
  const { themes, sectionFiles, sectionsDir } = useLoaderData<typeof loader>()
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const [debugOpen, setDebugOpen] = useState(false)

  // Add this after the existing useState declarations
  const [selectedSections, setSelectedSections] = useState<{ [key: string]: string }>({})

  const handleSectionChange = (themeId: string, value: string) => {
    setSelectedSections((prev) => ({
      ...prev,
      [themeId]: value,
    }))
  }

  const sectionOptions = [
    { label: "Choose a section file...", value: "" },
    ...sectionFiles.map((file: string) => ({
      label: file,
      value: file,
    })),
  ]

  console.log("Section options:", sectionOptions)
  console.log("Selected sections:", selectedSections)

  return (
    <Page title="Theme Manager" subtitle="Upload section files to your Shopify themes">
      <Layout>
        <Layout.Section>
          {/* Success/Error Messages */}
          {actionData && (
            <BlockStack gap="400">
              {actionData.success && actionData.message && (
                <Banner tone="success" title="Upload Successful">
                  <p>{actionData.message}</p>
                </Banner>
              )}
              {actionData.error && (
                <Banner tone="critical" title="Upload Failed">
                  <p>{actionData.error}</p>
                </Banner>
              )}
            </BlockStack>
          )}

          {/* Section Files Info */}
          {sectionFiles.length > 0 ? (
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h3">
                    Available Section Files
                  </Text>
                  <Badge tone="info">{sectionFiles?.length as any}</Badge>
                </InlineStack>
                <List type="bullet">
                  {sectionFiles.map((file: string) => (
                    <List.Item key={file}>{file}</List.Item>
                  ))}
                </List>
              </BlockStack>
            </Card>
          ) : (
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  No Section Files Found
                </Text>
                <Text as="p" tone="subdued">
                  Add .liquid files to the app/sections directory to get started.
                </Text>
                <Text as="p" tone="subdued">
                  Looking in: {sectionsDir}
                </Text>
                <CalloutCard
                  title="Create your first section file"
                  illustration="/placeholder.svg?height=60&width=60"
                  primaryAction={{
                    content: "Learn more",
                    url: "#instructions",
                  }}
                >
                  <p>
                    Create a .liquid file in the app/sections directory. For example: app/sections/hero-banner.liquid
                  </p>
                </CalloutCard>
              </BlockStack>
            </Card>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === "development" && (
            <Card>
              <Collapsible
                open={debugOpen}
                id="debug-collapsible"
                transition={{ duration: "150ms", timingFunction: "ease" }}
                expandOnPrint
              >
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">
                    Debug Information
                  </Text>
                  <InlineStack gap="400">
                    <Text as="p">Themes found: {themes.length}</Text>
                    <Text as="p">Section files found: {sectionFiles.length}</Text>
                  </InlineStack>
                  <Text as="p">Sections directory: {sectionsDir}</Text>
                  <TextContainer>
                    <Text variant="headingSm" as="h4">
                      Theme Details:
                    </Text>
                    <pre style={{ fontSize: "12px", overflow: "auto" }}>{JSON.stringify(themes, null, 2)}</pre>
                  </TextContainer>
                </BlockStack>
              </Collapsible>
              <div style={{ paddingTop: "8px" }}>
                <Button
                  variant="plain"
                  onClick={() => setDebugOpen(!debugOpen)}
                  ariaExpanded={debugOpen}
                  ariaControls="debug-collapsible"
                >
                  {debugOpen ? "Hide" : "Show"} Debug Info
                </Button>
              </div>
            </Card>
          )}

          {/* Themes List */}
          {themes.length === 0 ? (
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  No Themes Found
                </Text>
                <Text as="p">No themes are available in your Shopify store.</Text>
              </BlockStack>
            </Card>
          ) : (
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingLg" as="h2">
                    Themes
                  </Text>
                  <Badge tone="info">{themes.length}</Badge>
                </InlineStack>

                {themes.map((theme: Theme, index: number) => (
                  <div key={theme.id}>
                    <Card>
                      <BlockStack gap="400">
                        <InlineStack align="space-between">
                          <Text variant="headingMd" as="h3">
                            {theme.name}
                          </Text>
                          <Badge tone={theme.role === "main" ? "success" : "info"}>{theme.role}</Badge>
                        </InlineStack>

                        <Text as="p" tone="subdued">
                          Theme ID: {theme.id}
                        </Text>

                        {sectionFiles.length === 0 ? (
                          <CalloutCard
                            title="No section files available"
                            illustration="/placeholder.svg?height=60&width=60"
                            primaryAction={{
                              content: "Learn more",
                              url: "#instructions",
                            }}
                          >
                            <p>Add .liquid files to the app/sections directory to get started.</p>
                          </CalloutCard>
                        ) : (
                          <Form method="post">
                            <input type="hidden" name="themeId" value={theme.id} />
                            <input type="hidden" name="themeName" value={theme.name} />

                            <FormLayout>
                              <Select
                                label="Select Section File"
                                options={sectionOptions}
                                name="section"
                                value={selectedSections[theme.id] || ""}
                                onChange={(value) => handleSectionChange(theme.id, value)}
                                disabled={isSubmitting}
                                requiredIndicator
                              />

                              <Button submit variant="primary" loading={isSubmitting} disabled={isSubmitting}>
                                {isSubmitting ? "Uploading..." : "Upload to Theme"}
                              </Button>
                            </FormLayout>
                          </Form>
                        )}
                      </BlockStack>
                    </Card>
                    {index < themes.length - 1 && <Divider />}
                  </div>
                ))}
              </BlockStack>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h3">
                Instructions
              </Text>
              <List type="number">
                <List.Item>Place your .liquid section files in the app/sections directory</List.Item>
                <List.Item>Select a theme and choose the section file you want to upload</List.Item>
                <List.Item>Click "Upload to Theme" to add the section to your Shopify theme</List.Item>
              </List>
              <Text as="p" tone="subdued">
                Example section file path: app/sections/hero-banner.liquid
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
