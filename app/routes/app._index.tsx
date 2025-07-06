"use client";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Badge,
  Icon,
  Popover,
  ActionList,
  Toast,
  Frame,
} from "@shopify/polaris";
import {
  ViewIcon,
  XIcon,
  ExternalIcon,
  CreditCardIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  useNavigation,
  useSubmit,
  NavLink,
  Link,
} from "@remix-run/react";
import { connectToDB } from "app/db.server";
import UserModel from "app/models/userModel";
import PurchaseModel from "app/models/PurchaseModel";
import SectionModel from "app/models/SectionModel";
import { authenticate } from "app/shopify.server";
import { useState, useEffect } from "react";
import fs from "fs/promises";
import path from "path";

interface Theme {
  id: string;
  name: string;
  role: string;
}

interface Section {
  _id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  isFree: boolean;
  category: string;
  isPopular: boolean;
  isTrending: boolean;
  price: number;
  filePath: string;
  identifier: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await connectToDB();

  const { admin } = await authenticate.admin(request);
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const user = await UserModel.findOne({ shop });

  if (!user) {
    return json({
      sections: [],
      themes: [],
      freeSections: [],
      paidSections: [],
    });
  }

  // Fetch purchased sections

  const purchases = await PurchaseModel.find({ userId: user._id })
    .populate("sectionId")
    .lean();

  const sections = purchases.map((purchase: any) => ({
    _id: purchase.sectionId._id.toString(),
    name: purchase.sectionId.name,
    description: purchase.sectionId.description,
    thumbnailUrl: purchase.sectionId.thumbnailUrl,
    isFree: purchase.sectionId.isFree,
    category: purchase.sectionId.category,
    isPopular: purchase.sectionId.isPopular,
    isTrending: purchase.sectionId.isTrending,
    price: purchase.sectionId.price,
    filePath: purchase.sectionId.filePath,
    identifier: purchase.sectionId.identifier,
  }));

  const allSections = sections;

  // Fetch themes via GraphQL
  let themes: Theme[] = [];

  try {
    const response = await admin.graphql(`
      {
        themes(first: 50) {
          edges {
            node {
              id
              name
              role
            }
          }
        }
      }
    `);

    const jsonData = (await response.json()) as any;

    if (jsonData.errors) {
    } else {
      themes = jsonData.data.themes.edges.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        role: edge.node.role,
      }));
    }
  } catch (error) {}

  return json({ sections, themes, allSections });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const sectionId = formData.get("sectionId") as string;
  const themeId = formData.get("themeId") as string;
  const sectionIdentifier = formData.get("sectionIdentifier") as string;
  const filePath = formData.get("filePath") as string;

  if (!sectionId || !themeId || !sectionIdentifier || !filePath) {
    return json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    await connectToDB();

    const { admin } = await authenticate.admin(request);

    const fullFilePath = path.join(process.cwd(), "app", "sections", filePath);

    let content: string;
    try {
      content = await fs.readFile(fullFilePath, "utf-8");
    } catch (fileError: any) {
      const alternativePath = path.join(process.cwd(), filePath);

      try {
        content = await fs.readFile(alternativePath, "utf-8");
      } catch (altError) {
        return json(
          {
            error: `Failed to read section file: ${fileError.message}. Tried paths: ${fullFilePath}, ${alternativePath}`,
          },
          { status: 500 },
        );
      }
    }

    // Upload section to theme using GraphQL

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
    `;

    const variables = {
      themeId: themeId,
      files: [
        {
          filename: `sections/${sectionIdentifier}.liquid`,
          body: {
            type: "TEXT",
            value: content,
          },
        },
      ],
    };

    const response = await admin.graphql(mutation, { variables });
    const responseData = (await response.json()) as any;

    if (responseData.errors) {
      return json(
        { error: `GraphQL Error: ${JSON.stringify(responseData.errors)}` },
        { status: 400 },
      );
    }

    if (responseData.data.themeFilesUpsert.userErrors.length > 0) {
      return json(
        {
          error: `Upload Error: ${JSON.stringify(responseData.data.themeFilesUpsert.userErrors)}`,
        },
        { status: 400 },
      );
    }

    // Update download count

    await SectionModel.findByIdAndUpdate(sectionId, {
      $inc: { downloadCount: 1 },
    });

    return json({
      success: true,
      message: "Section added to theme successfully",
    });
  } catch (error: any) {
    return json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}

export default function MySectionsPage() {
  const { sections, themes, allSections } = useLoaderData<
    typeof loader
  >() as any;
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const [popoverActive, setPopoverActive] = useState<{
    [key: string]: boolean;
  }>({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorBanner, setShowErrorBanner] = useState(true);
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Show success toast when action succeeds
  useEffect(() => {
    if (actionData?.success) {
      setShowSuccessToast(true);
    }
  }, [actionData]);

  const togglePopover = (sectionId: string) => {
    setPopoverActive((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleThemeSelect = (
    sectionId: string,
    themeId: string,
    themeName: string,
    section: Section,
  ) => {
    // Close popover
    setPopoverActive((prev) => ({
      ...prev,
      [sectionId]: false,
    }));

    // Set loading state
    setLoadingStates((prev) => ({
      ...prev,
      [sectionId]: true,
    }));

    // Submit form automatically
    const formData = new FormData();
    formData.append("sectionId", sectionId);
    formData.append("themeId", themeId);
    formData.append("sectionIdentifier", section.identifier);
    formData.append("filePath", section.filePath);

    submit(formData, { method: "post" });
  };

  // Reset loading states when submission completes
  useEffect(() => {
    if (!isSubmitting) {
      setLoadingStates({});
    }
  }, [isSubmitting]);

  const renderSectionCard = (section: Section) => {
    const isLoading = loadingStates[section._id] || false;

    return (
      <div key={section._id} style={{ width: "100%", maxWidth: "300px" }}>
        <Card padding="400">
          <BlockStack gap="200">
            {/* Large Custom Image */}
            <div
              style={{
                width: "100%",
                height: "150px",
                backgroundColor: "#f6f6f7",
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {section.thumbnailUrl ? (
                <img
                  src={section.thumbnailUrl || "/placeholder.svg"}
                  alt={section.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#e1e3e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6d7175",
                  }}
                >
                  <Text as="span" variant="bodyMd">
                    No Preview
                  </Text>
                </div>
              )}
            </div>

            <InlineStack gap="200" align="space-between">
              <Text as="h3" variant="headingMd">
                {section.name}
              </Text>

              <Badge tone={section.isFree ? "success" : "attention"}>
                {section.isFree ? "Free" : "Paid"}
              </Badge>
              {section.isPopular && <Badge tone="info">Popular</Badge>}
              {section.isTrending && <Badge tone="warning">Trending</Badge>}
            </InlineStack>

            <InlineStack gap="200" align="start" blockAlign="center">
              <Popover
                active={popoverActive[section._id] || false}
                activator={
                  <Button
                    variant="primary"
                    disclosure
                    onClick={() => togglePopover(section._id)}
                    disabled={themes.length === 0 || isLoading}
                    loading={isLoading}
                    fullWidth={true}
                  >
                    {isLoading ? "Adding..." : "Add to theme"}
                  </Button>
                }
                onClose={() => togglePopover(section._id)}
              >
                <ActionList
                  items={themes.map((theme: any) => ({
                    content: `${theme.name} ${theme.role === "MAIN" ? "(Live)" : ""}`,
                    onAction: () =>
                      handleThemeSelect(
                        section._id,
                        theme.id,
                        theme.name,
                        section,
                      ),
                  }))}
                />
              </Popover>

              <Link to={`/app/my-section/preview/${section._id}`}>
                <Icon source={ViewIcon} tone="base" />
              </Link>
            </InlineStack>
          </BlockStack>
        </Card>
      </div>
    );
  };

  // Grid container styles
  const gridStyles = {
    display: "flex",
    gap: "20px",
    width: "100%",
  };

  const toastMarkup = showSuccessToast ? (
    <Toast
      content="Section added to theme successfully!"
      onDismiss={() => setShowSuccessToast(false)}
    />
  ) : null;

  return (
    <Frame>
      <Page
        fullWidth
        title="My sections"
        subtitle="The sections you own will show here."
      >
        <Layout>
          {/* Error Banner (only show errors, dismissible) */}
          {actionData?.error && showErrorBanner && (
            <Layout.Section>
              <Card padding="400">
                <InlineStack align="space-between" blockAlign="start">
                  <Text as="p" tone="critical">
                    {actionData.error}
                  </Text>
                  <Button
                    icon={XIcon}
                    variant="plain"
                    onClick={() => setShowErrorBanner(false)}
                    accessibilityLabel="Dismiss error"
                  />
                </InlineStack>
              </Card>
            </Layout.Section>
          )}

          {/* Welcome Section with Explore Button */}
          <Layout.Section>
            <Card padding="400">
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Welcome to Sections Stack
                    </Text>
                    <Text as="p" tone="subdued">
                      Manage and add your purchased sections to any theme in
                      your store.
                    </Text>
                  </BlockStack>
                  <Button
                    variant="primary"
                    url="/app/sections/store"
                    icon={ExternalIcon}
                  >
                    Explore Sections
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          {sections.length === 0 ? (
            /* Empty State */
            <Layout.Section>
              <Card padding="600">
                <BlockStack gap="400" align="center">
                  <Text as="h2" variant="headingLg" alignment="center">
                    A better way to customize your Shopify store
                  </Text>
                  <Text as="p" alignment="center" tone="subdued">
                    Sections Stack let's you buy beautifully designed, pre-made
                    Shopify sections. All sections are plug-n-play ready to be
                    customized in the theme editor. Works with Online Store 2.0
                    (add to any page).
                  </Text>

                  {/* Steps Illustration */}
                  <div style={{ margin: "40px 0" }}>
                    <InlineStack gap="600" align="center">
                      <BlockStack gap="200" align="center">
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            backgroundColor: "#f6f6f7",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                        >
                          <Icon source={ViewIcon} tone="base" />
                        </div>
                        <Text as="h4" variant="headingSm" alignment="center">
                          Step 1: Browse and find sections
                        </Text>
                        <Text as="p" alignment="center" tone="subdued">
                          Find the sections you need & see <br></br> the live
                          demo store.
                        </Text>
                      </BlockStack>

                      <BlockStack gap="200" align="center">
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            backgroundColor: "#f6f6f7",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                        >
                          <Text as="span" variant="headingMd">
                            <Icon source={CreditCardIcon} tone="base" />
                          </Text>
                        </div>
                        <Text as="h4" variant="headingSm" alignment="center">
                          Step 2: Purchase sections
                        </Text>
                        <Text as="p" alignment="center" tone="subdued">
                          Purchase sections & own it forever on your store.
                          <br></br> One time fee. Some sections are free.
                        </Text>
                      </BlockStack>

                      <BlockStack gap="200" align="center">
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            backgroundColor: "#f6f6f7",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                        >
                          <Text as="span" variant="headingMd">
                            <Icon source={SettingsIcon} tone="base" />
                          </Text>
                        </div>
                        <Text as="h4" variant="headingSm" alignment="center">
                          Step 3: Add and customise
                        </Text>
                        <Text as="p" alignment="center" tone="subdued">
                          Time to add the section to your theme & <br></br>{" "}
                          customize it through the theme editor.
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  </div>

                  <Button
                    variant="primary"
                    size="large"
                    url="/app/sections/store"
                  >
                    Explore Sections
                  </Button>
                </BlockStack>
              </Card>
            </Layout.Section>
          ) : (
            <>
              {/* All Sections in Grid */}
              <Layout.Section>
                <BlockStack gap="400">
                  {allSections.length > 0 && (
                    <div style={gridStyles}>
                      {allSections.map(renderSectionCard)}
                    </div>
                  )}
                </BlockStack>
              </Layout.Section>
            </>
          )}
        </Layout>
      </Page>
      {toastMarkup}
    </Frame>
  );
}
