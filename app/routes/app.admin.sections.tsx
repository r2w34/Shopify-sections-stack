"use client";

import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Button,
  FormLayout,
  Select,
  Badge,
  Banner,
  InlineStack,
  BlockStack,
  Toast,
  DropZone,
  Thumbnail,
  Frame,
  Grid,
  Modal,
  Checkbox,
  Tag,
  Divider,
} from "@shopify/polaris";
import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import {
  useLoaderData,
  Form,
  useActionData,
  useNavigate,
  useSubmit,
} from "@remix-run/react";
import { useState, useEffect } from "react";
import { EditIcon, DeleteIcon } from "@shopify/polaris-icons";
import SectionModel from "app/models/SectionModel";
import { connectToDB } from "app/db.server";
import fs from "fs/promises";
import path from "path";

export async function loader({ request }: LoaderFunctionArgs) {
  await connectToDB();
  const url = new URL(request.url);
  const success = url.searchParams.get("success");
  const deleted = url.searchParams.get("deleted");

  const sections = await SectionModel.find().sort({ createdAt: -1 }).lean();
  return json({ sections, success, deleted });
}

export async function action({ request }: ActionFunctionArgs) {
  await connectToDB();
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  // Handle delete action
  if (intent === "delete") {
    const sectionId = formData.get("sectionId")?.toString();
    if (!sectionId) {
      return json(
        { error: "Section ID is required for deletion." },
        { status: 400 },
      );
    }

    try {
      const section = await SectionModel.findById(sectionId);
      if (section) {
        // Delete the associated .liquid file
        const filePath = path.join(
          process.cwd(),
          "app",
          "sections",
          section.filePath,
        );
        try {
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (fileErr) {
          console.warn(`Could not delete file: ${filePath}`, fileErr);
        }
      }

      await SectionModel.findByIdAndDelete(sectionId);
      return redirect("/app/admin/sections?deleted=1");
    } catch (err: any) {
      console.error("❌ Section deletion failed:", err);
      return json({ error: err.message }, { status: 500 });
    }
  }

  // Handle create action
  const name = formData.get("name")?.toString();
  const identifier = formData.get("identifier")?.toString();
  const description = formData.get("description")?.toString();
  const category = formData.get("category")?.toString();
  const type = formData.get("type")?.toString();
  const price = Number.parseFloat(formData.get("price")?.toString() || "0");
  const thumbnailUrl = formData.get("thumbnailUrl")?.toString();
  const demoUrl = formData.get("demoUrl")?.toString();
  const isPopular = formData.get("isPopular") === "on";
  const isTrending = formData.get("isTrending") === "on";
  const isFeatured = formData.get("isFeatured") === "on";

  // Parse detailed features (one per line)
  const detailedFeaturesText =
    formData.get("detailedFeatures")?.toString() || "";
  const detailedFeatures = detailedFeaturesText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Parse tags (comma separated)
  const tagsText = formData.get("tags")?.toString() || "";
  const tags = tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  // Parse image gallery URLs (comma separated)
  const imageGalleryText = formData.get("imageGallery")?.toString() || "";
  const imageGallery = imageGalleryText
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  console.log("📨 Form data received:", {
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
  });

  if (!name || !identifier || !type || !category) {
    console.warn("⚠️ Missing required fields");
    return json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    const filePath = `${type}/${identifier}.liquid`;

    // Create the section in database
    const created = await SectionModel.create({
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
      filePath,
      isPopular,
      isTrending,
      isFeatured,
    });

    // Create the .liquid file automatically
    const sectionsDir = path.join(process.cwd(), "app", "sections");
    const typeDir = path.join(sectionsDir, type);
    const liquidFilePath = path.join(typeDir, `${identifier}.liquid`);

    // Ensure directories exist
    await fs.mkdir(typeDir, { recursive: true });

    // Create a basic .liquid template
    const liquidTemplate = `{% comment %}
  ${name}
  Category: ${category}
  ${description ? `Description: ${description}` : ""}
  Created: ${new Date().toISOString()}
{% endcomment %}

<div class="${identifier}-section">
  <div class="container">
    <h2>{{ section.settings.heading | default: '${name}' }}</h2>
    {% if section.settings.description != blank %}
      <p>{{ section.settings.description }}</p>
    {% endif %}
    
    <!-- Add your section content here -->
    
  </div>
</div>

<style>
  .${identifier}-section {
    padding: 60px 0;
  }
  
  .${identifier}-section .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
  
  /* Add your custom styles here */
</style>

{% schema %}
{
  "name": "${name}",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "${name}"
    },
    {
      "type": "textarea",
      "id": "description",
      "label": "Description"
    }
  ],
  "presets": [
    {
      "name": "${name}"
    }
  ]
}
{% endschema %}`;

    await fs.writeFile(liquidFilePath, liquidTemplate, "utf-8");
    console.log(`✅ Created liquid file: ${liquidFilePath}`);

    console.log("✅ Section created:", created);
    return redirect("/app/admin/sections?success=1");
  } catch (err: any) {
    console.error("❌ Section creation failed:", err);
    return json({ error: err.message }, { status: 500 });
  }
}

export default function AdminSectionsPage() {
  const { sections, success, deleted } = useLoaderData<typeof loader>();
  const actionData = useActionData() as any;
  const navigate = useNavigate();
  const submit = useSubmit();

  // Form states
  const [type, setType] = useState("free");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [detailedFeatures, setDetailedFeatures] = useState("");
  const [tags, setTags] = useState("");
  const [imageGallery, setImageGallery] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Toast states
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    sectionId: string;
    sectionName: string;
  }>({
    isOpen: false,
    sectionId: "",
    sectionName: "",
  });

  // Handle toast notifications
  useEffect(() => {
    if (success === "1") {
      setShowSuccessToast(true);
    }
    if (deleted === "1") {
      setShowDeleteToast(true);
    }
  }, [success, deleted]);

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
  ];

  const handleDrop = async (_: any, acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
    setUploading(true);

    const data = new FormData();
    data.append("file", uploadedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      setThumbnailUrl(json.url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (sectionId: string) => {
    navigate(`/app/admin/section/${sectionId}/edit`);
  };

  const handleDeleteClick = (sectionId: string, sectionName: string) => {
    setDeleteModal({
      isOpen: true,
      sectionId,
      sectionName,
    });
  };

  const handleDeleteConfirm = () => {
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("sectionId", deleteModal.sectionId);

    submit(formData, { method: "post" });
    setDeleteModal({ isOpen: false, sectionId: "", sectionName: "" });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, sectionId: "", sectionName: "" });
  };

  return (
    <Frame>
      <Page title="Manage Sections">
        {showSuccessToast && (
          <Toast
            content="Section added successfully!"
            onDismiss={() => setShowSuccessToast(false)}
            duration={4000}
          />
        )}

        {showDeleteToast && (
          <Toast
            content="Section deleted successfully!"
            onDismiss={() => setShowDeleteToast(false)}
            duration={4000}
          />
        )}

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
                  Add New Section
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
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "16px",
                          }}
                        >
                          <Thumbnail
                            size="large"
                            alt="Thumbnail preview"
                            source={URL.createObjectURL(file)}
                          />
                        </div>
                      ) : (
                        <DropZone.FileUpload
                          actionTitle="Upload thumbnail"
                          actionHint="Accepts .jpg, .png, .gif"
                        />
                      )}
                    </DropZone>
                    <input
                      type="hidden"
                      name="thumbnailUrl"
                      value={thumbnailUrl}
                    />

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
                      <Checkbox
                        label="Popular section"
                        checked={isPopular}
                        onChange={setIsPopular}
                        name="isPopular"
                      />
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

                    <Button
                      submit
                      variant="primary"
                      loading={uploading}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Add Section"}
                    </Button>
                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>

            <Card padding="400">
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Existing Sections ({sections.length})
                </Text>

                {sections.length === 0 ? (
                  <Text as="p" tone="subdued">
                    No sections added yet.
                  </Text>
                ) : (
                  <Grid>
                    {sections.map((section: any) => (
                      <Grid.Cell
                        key={section._id}
                        columnSpan={{ xs: 6, sm: 3, md: 2, lg: 4 }}
                      >
                        <Card padding="400">
                          <BlockStack gap="300">
                            {section.thumbnailUrl && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                <Thumbnail
                                  size="large"
                                  alt={section.name}
                                  source={section.thumbnailUrl}
                                />
                              </div>
                            )}

                            <BlockStack gap="200">
                              <Text as="h3" variant="headingMd" truncate>
                                {section.name}
                              </Text>
                              <Text as="p" tone="subdued" truncate>
                                {section.identifier}
                              </Text>
                              <Badge tone="info">{section.category}</Badge>

                              {section.tags && section.tags.length > 0 && (
                                <InlineStack gap="100">
                                  {section.tags
                                    .slice(0, 3)
                                    .map((tag: string, index: number) => (
                                      <Tag key={index}>{tag}</Tag>
                                    ))}
                                  {section.tags.length > 3 && (
                                    <Text as="span" tone="subdued">
                                      +{section.tags.length - 3}
                                    </Text>
                                  )}
                                </InlineStack>
                              )}

                              {section.description && (
                                <Text as="p" tone="subdued">
                                  {section.description.length > 60
                                    ? `${section.description.substring(0, 60)}...`
                                    : section.description}
                                </Text>
                              )}
                            </BlockStack>

                            <InlineStack
                              align="space-between"
                              blockAlign="center"
                            >
                              <Badge
                                tone={section.isFree ? "success" : "attention"}
                              >
                                {section.isFree ? "Free" : `$${section.price}`}
                              </Badge>

                              <InlineStack gap="200">
                                <Button
                                  variant="tertiary"
                                  size="micro"
                                  icon={EditIcon}
                                  onClick={() => handleEdit(section._id)}
                                  accessibilityLabel={`Edit ${section.name}`}
                                />
                                <Button
                                  variant="tertiary"
                                  size="micro"
                                  tone="critical"
                                  icon={DeleteIcon}
                                  onClick={() =>
                                    handleDeleteClick(section._id, section.name)
                                  }
                                  accessibilityLabel={`Delete ${section.name}`}
                                />
                              </InlineStack>
                            </InlineStack>
                          </BlockStack>
                        </Card>
                      </Grid.Cell>
                    ))}
                  </Grid>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Delete Confirmation Modal */}
        <Modal
          open={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          title="Delete Section"
          primaryAction={{
            content: "Delete",
            onAction: handleDeleteConfirm,
            destructive: true,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: handleDeleteCancel,
            },
          ]}
        >
          <Modal.Section>
            <Text as="p">
              Are you sure you want to delete "{deleteModal.sectionName}"? This
              action cannot be undone and will also delete the associated
              .liquid file.
            </Text>
          </Modal.Section>
        </Modal>
      </Page>
    </Frame>
  );
}
