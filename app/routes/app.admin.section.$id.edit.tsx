"use client"

import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Button,
  FormLayout,
  Select,
  Banner,
  BlockStack,
  DropZone,
  Thumbnail,
  Frame,
  Checkbox,
  Tag,
  InlineStack,
} from "@shopify/polaris"
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Form, useActionData, useNavigate } from "@remix-run/react"
import { useState } from "react"
import SectionModel from "app/models/SectionModel"
import { connectToDB } from "app/db.server"
import fs from "fs/promises"
import path from "path"

export async function loader({ params }: LoaderFunctionArgs) {
  await connectToDB()
  const sectionId = params.id
  console.log("📦 [LOADER] sectionId param:", sectionId)

  if (!sectionId) {
    throw new Response("Section ID is required", { status: 400 })
  }

  const section = (await SectionModel.findById(sectionId).lean()) as any
  console.log("✅ [LOADER] Loaded section:", section)

  if (!section) {
    throw new Response("Section not found", { status: 404 })
  }

  return json({ section })
}

export async function action({ request, params }: ActionFunctionArgs) {
  await connectToDB()
  const sectionId = params.id
  const formData = await request.formData()

  const name = formData.get("name")?.toString()
  const identifier = formData.get("identifier")?.toString()
  const description = formData.get("description")?.toString()
  const category = formData.get("category")?.toString()
  const type = formData.get("type")?.toString()
  const price = Number.parseFloat(formData.get("price")?.toString() || "0")
  const thumbnailUrl = formData.get("thumbnailUrl")?.toString()
  const demoUrl = formData.get("demoUrl")?.toString()
  const isPopular = formData.get("isPopular") === "on"
  const isTrending = formData.get("isTrending") === "on"
  const isFeatured = formData.get("isFeatured") === "on"

  // Parse detailed features (one per line)
  const detailedFeaturesText = formData.get("detailedFeatures")?.toString() || ""
  const detailedFeatures = detailedFeaturesText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  // Parse tags (comma separated)
  const tagsText = formData.get("tags")?.toString() || ""
  const tags = tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

  // Parse image gallery URLs (comma separated)
  const imageGalleryText = formData.get("imageGallery")?.toString() || ""
  const imageGallery = imageGalleryText
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0)

  console.log("📨 [ACTION] Form submission for section:", {
    sectionId,
    name,
    identifier,
    description,
    category,
    type,
    price,
    thumbnailUrl,
    detailedFeatures,
    tags,
    imageGallery,
    demoUrl,
    isPopular,
    isTrending,
    isFeatured,
  })

  if (!name || !identifier || !type || !category) {
    console.warn("⚠️ [ACTION] Missing required fields")
    return json({ error: "Missing required fields." }, { status: 400 })
  }

  try {
    // Get the current section to check if file path needs updating
    const currentSection = await SectionModel.findById(sectionId)
    const oldFilePath = currentSection?.filePath
    const newFilePath = `${type}/${identifier}.liquid`

    const updated = await SectionModel.findByIdAndUpdate(sectionId, {
      name,
      identifier,
      description,
      detailedFeatures,
      category,
      tags,
      thumbnailUrl,
      imageGallery,
      demoUrl,
      isFree: type === "free",
      price: type === "paid" ? price : 0,
      filePath: newFilePath,
      isPopular,
      isTrending,
      isFeatured,
    })

    // Handle file path changes (move file if needed)
    if (oldFilePath && oldFilePath !== newFilePath) {
      const sectionsDir = path.join(process.cwd(), "app", "sections")
      const oldFullPath = path.join(sectionsDir, oldFilePath)
      const newFullPath = path.join(sectionsDir, newFilePath)

      try {
        // Ensure new directory exists
        await fs.mkdir(path.dirname(newFullPath), { recursive: true })

        // Move the file
        await fs.rename(oldFullPath, newFullPath)
        console.log(`✅ [ACTION] Moved file from ${oldFullPath} to ${newFullPath}`)
      } catch (fileErr) {
        console.warn(`⚠️ [ACTION] Could not move file: ${fileErr}`)
      }
    }

    console.log("✅ [ACTION] Section updated:", updated)
    return redirect("/app/admin/sections?success=1")
  } catch (err: any) {
    console.error("❌ [ACTION] Section update failed:", err)
    return json({ error: err.message }, { status: 500 })
  }
}

export default function EditSectionPage() {
  const { section } = useLoaderData<typeof loader>()
  console.log("🔥 Section loaded:", section)
  const actionData = useActionData() as any
  const navigate = useNavigate()

  // Form states
  const [type, setType] = useState(section.isFree ? "free" : "paid")
  const [name, setName] = useState(section.name || "")
  const [identifier, setIdentifier] = useState(section.identifier || "")
  const [description, setDescription] = useState(section.description || "")
  const [category, setCategory] = useState(section.category || "")
  const [price, setPrice] = useState(section.price?.toString() || "")
  const [thumbnailUrl, setThumbnailUrl] = useState(section.thumbnailUrl || "")
  const [detailedFeatures, setDetailedFeatures] = useState(
    section.detailedFeatures ? section.detailedFeatures.join("\n") : "",
  )
  const [tags, setTags] = useState(section.tags ? section.tags.join(", ") : "")
  const [imageGallery, setImageGallery] = useState(section.imageGallery ? section.imageGallery.join(", ") : "")
  const [demoUrl, setDemoUrl] = useState(section.demoUrl || "")
  const [isPopular, setIsPopular] = useState(section.isPopular || false)
  const [isTrending, setIsTrending] = useState(section.isTrending || false)
  const [isFeatured, setIsFeatured] = useState(section.isFeatured || false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const categoryOptions = [
    { label: "Select category...", value: "" },
    { label: "Hero", value: "hero" },
    { label: "Testimonial", value: "testimonial" },
    { label: "Video", value: "video" },
    { label: "Text", value: "text" },
    { label: "Images", value: "images" },
    { label: "Snippet", value: "snippet" },
    { label: "Countdown", value: "countdown" },
    { label: "Scrolling", value: "scrolling" },
    { label: "Featured", value: "featured" },
    { label: "Other", value: "other" },
  ]

  const handleDrop = async (_: any, acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    setFile(uploadedFile)
    setUploading(true)

    console.log("📸 [UPLOAD] Uploading file:", uploadedFile.name)

    const data = new FormData()
    data.append("file", uploadedFile)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      })

      const json = await res.json()
      console.log("✅ [UPLOAD] Uploaded URL:", json.url)
      setThumbnailUrl(json.url)
    } catch (error) {
      console.error("❌ [UPLOAD] Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Frame>
      <Page
        title={`Edit Section: ${section.name}`}
        backAction={{
          content: "Back to Sections",
          onAction: () => navigate("/app/admin/sections"),
        }}
      >
        <Layout>
          <Layout.Section>
            {actionData?.error && (
              <Banner title="Error" tone="critical">
                <p>{actionData.error}</p>
              </Banner>
            )}

            <Card padding="400">
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Edit Section Details
                </Text>

                <Form method="post">
                  <FormLayout>
                    <FormLayout.Group>
                      <TextField
                        label="Name"
                        name="name"
                        value={name}
                        onChange={setName}
                        requiredIndicator
                        autoComplete="off"
                      />
                      <TextField
                        label="Identifier (e.g. hero-banner-v2)"
                        name="identifier"
                        value={identifier}
                        onChange={setIdentifier}
                        autoComplete="off"
                        requiredIndicator
                      />
                    </FormLayout.Group>

                    <FormLayout.Group>
                      <Select
                        label="Category"
                        name="category"
                        options={categoryOptions}
                        value={category}
                        onChange={setCategory}
                        requiredIndicator
                      />
                      <Select
                        label="Type"
                        name="type"
                        options={[
                          { label: "Free", value: "free" },
                          { label: "Paid", value: "paid" },
                        ]}
                        value={type}
                        onChange={setType}
                      />
                    </FormLayout.Group>

                    <TextField
                      label="Description"
                      name="description"
                      value={description}
                      onChange={setDescription}
                      multiline={3}
                      autoComplete="off"
                    />

                    <TextField
                      label="Detailed Features (one per line)"
                      name="detailedFeatures"
                      value={detailedFeatures}
                      onChange={setDetailedFeatures}
                      multiline={5}
                      autoComplete="off"
                      helpText="Enter each feature on a new line. These will be displayed as bullet points."
                    />

                    <TextField
                      label="Tags (comma separated)"
                      name="tags"
                      value={tags}
                      onChange={setTags}
                      autoComplete="off"
                      helpText="e.g. responsive, modern, animated"
                    />

                    <DropZone onDrop={handleDrop} accept="image/*" type="image">
                      {file ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                          <Thumbnail size="large" alt="Thumbnail preview" source={URL.createObjectURL(file)} />
                        </div>
                      ) : thumbnailUrl ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                          <Thumbnail size="large" alt="Current thumbnail" source={thumbnailUrl} />
                        </div>
                      ) : (
                        <DropZone.FileUpload actionTitle="Upload thumbnail" actionHint="Accepts .jpg, .png, .gif" />
                      )}
                    </DropZone>
                    <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />

                    <TextField
                      label="Additional Images (comma separated URLs)"
                      name="imageGallery"
                      value={imageGallery}
                      onChange={setImageGallery}
                      autoComplete="off"
                      helpText="Enter image URLs separated by commas for gallery"
                    />

                    <TextField
                      label="Demo Store URL"
                      name="demoUrl"
                      value={demoUrl}
                      onChange={setDemoUrl}
                      autoComplete="off"
                      helpText="Link to a demo store showing this section"
                    />

                    {type === "paid" && (
                      <TextField
                        label="Price ($)"
                        name="price"
                        value={price}
                        onChange={setPrice}
                        type="number"
                        autoComplete="off"
                      />
                    )}

                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Section Flags
                      </Text>
                      <Checkbox label="Popular section" checked={isPopular} onChange={setIsPopular} name="isPopular" />
                      <Checkbox
                        label="Trending section"
                        checked={isTrending}
                        onChange={setIsTrending}
                        name="isTrending"
                      />
                      <Checkbox
                        label="Featured section"
                        checked={isFeatured}
                        onChange={setIsFeatured}
                        name="isFeatured"
                      />
                    </BlockStack>

                    <Button submit variant="primary" loading={uploading} disabled={uploading}>
                      {uploading ? "Uploading..." : "Update Section"}
                    </Button>
                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>

            {/* Current Section Info */}
            <Card padding="400">
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Current Section Information
                </Text>
                <InlineStack gap="200">
                  <Text as="p">
                    <strong>File Path:</strong> {section.filePath}
                  </Text>
                  <Text as="p">
                    <strong>Created:</strong> {new Date(section.createdAt).toLocaleDateString()}
                  </Text>
                </InlineStack>
                {section.tags && section.tags.length > 0 && (
                  <div>
                    <Text as="p">
                      <strong>Current Tags:</strong>
                    </Text>
                    <InlineStack gap="100">
                      {section.tags.map((tag: string, index: number) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </InlineStack>
                  </div>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  )
}
