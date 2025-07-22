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
import SectionContentModel from "app/models/sectionContentModel";
import { connectToDB } from "app/db.server";
import { requireAdmin } from "app/utils/requireAdmin";

export async function loader({ request }: LoaderFunctionArgs) {
  await connectToDB();
  await requireAdmin(request);
  const url = new URL(request.url);
  const success = url.searchParams.get("success");
  const deleted = url.searchParams.get("deleted");

  const sections = await SectionModel.find().sort({ createdAt: -1 }).lean();
  return json({ sections, success, deleted });
}

export async function action({ request }: ActionFunctionArgs) {
  await connectToDB();
  await requireAdmin(request);

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
      // Delete the section content first
      await SectionContentModel.findOneAndDelete({ sectionId });

      // Then delete the section
      await SectionModel.findByIdAndDelete(sectionId);

      return json({ deleted: true });
    } catch (err: any) {
      return json({ error: err.message }, { status: 500 });
    }
  }

  // Handle create action
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const category = formData.get("category")?.toString();
  const type = formData.get("type")?.toString();
  const price = Number.parseFloat(formData.get("price")?.toString() || "0");
  const thumbnailUrl = formData.get("thumbnailUrl")?.toString();
  const isPopular = formData.get("isPopular") === "true";
  const isTrending = formData.get("isTrending") === "true";
  const isFeatured = formData.get("isFeatured") === "true";

  const customCode = formData.get("customCode")?.toString() || "";
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

  if (!name || !type || !category) {
    return json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    // Create the section in database
    const created = await SectionModel.create({
      name,
      description,
      detailedFeatures,
      category,
      tags,
      thumbnailUrl,
      imageGallery,
      isFree: type === "free",
      price: type === "paid" ? price : 0,
      isPopular,
      isTrending,
      isFeatured,
    });

    // Create the section content
    const liquidTemplate =
      customCode.trim().length > 0
        ? customCode
        : `{% comment %}
  ${name}
  Category: ${category}
  ${description ? `Description: ${description}` : ""}
  Created: ${new Date().toISOString()}
{% endcomment %}

<div class="${name.toLowerCase().replace(/\s+/g, "-")}-section">
  <div class="container">
    <h2>{{ section.settings.heading | default: '${name}' }}</h2>
    {% if section.settings.description != blank %}
      <p>{{ section.settings.description }}</p>
    {% endif %}
    
    <!-- Add your section content here -->
    
  </div>
</div>

<style>
  .${name.toLowerCase().replace(/\s+/g, "-")}-section {
    padding: 60px 0;
  }
  .${name.toLowerCase().replace(/\s+/g, "-")}-section .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
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

    // Save the section content to database
    await SectionContentModel.create({
      sectionId: created._id,
      content: liquidTemplate,
    });

    return json({ success: true });
  } catch (err: any) {
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
  const [customCode, setCustomCode] = useState("");

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

  function resetForm() {
    setType("free");
    setName("");
    setDescription("");
    setCategory("");
    setPrice("");
    setThumbnailUrl("");
    setDetailedFeatures("");
    setTags("");
    setImageGallery("");
    setDemoUrl("");
    setIsPopular(false);
    setIsTrending(false);
    setIsFeatured(false);
    setFile(null);
    setCustomCode("");
  }

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

  useEffect(() => {
    if (actionData?.success) {
      setShowSuccessToast(true);
      resetForm();
    }
    if (actionData?.deleted) {
      setShowDeleteToast(true);
      resetForm();
    }
  }, [actionData]);
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

                <Form
                  method="post"
                  onSubmit={() => {
                    // Ensure checkboxes are submitted as 'true' or 'false' strings
                    // This is handled by the hidden inputs below
                  }}
                >
                  <FormLayout>
                    <TextField
                      label="Name"
                      name="name"
                      value={name}
                      onChange={setName}
                      requiredIndicator
                      autoComplete="off"
                    />

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

                    <DropZone
                      onDrop={async (_dropFiles, acceptedFiles) => {
                        if (acceptedFiles.length === 0) return;

                        setUploading(true);

                        const uploadedUrls: string[] = [];

                        for (const file of acceptedFiles) {
                          const data = new FormData();
                          data.append("file", file);

                          try {
                            const res = await fetch("/api/upload", {
                              method: "POST",
                              body: data,
                            });
                            const json = await res.json();
                            uploadedUrls.push(json.url);
                          } catch (error) {
                            console.error("Upload failed:", error);
                          }
                        }

                        // Merge with any existing images
                        const existing = imageGallery
                          ? imageGallery.split(",").map((url) => url.trim())
                          : [];
                        const combined = [...existing, ...uploadedUrls];

                        setImageGallery(combined.join(", "));
                        setUploading(false);
                      }}
                      accept="image/*"
                      allowMultiple
                      type="image"
                    >
                      <DropZone.FileUpload
                        actionTitle="Upload Additional Images"
                        actionHint="You can select multiple images"
                      />
                    </DropZone>

                    <input
                      type="hidden"
                      name="imageGallery"
                      value={imageGallery}
                    />

                    {imageGallery && (
                      <BlockStack gap="200">
                        <Text as="h4" variant="headingSm">
                          Gallery Images:
                        </Text>
                        <InlineStack gap="100">
                          {imageGallery
                            .split(",")
                            .map((url, index) => url.trim())
                            .filter(Boolean)
                            .map((url, index, arr) => (
                              <div key={index} style={{ position: "relative", display: "inline-block" }}>
                                <img
                                  src={url}
                                  alt={`Gallery ${index}`}
                                  style={{
                                    width: "80px",
                                    height: "60px",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                    border: "1px solid #eee",
                                    background: "#fafafa",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Remove the image at this index
                                    const newGallery = arr.filter((_, i) => i !== index);
                                    setImageGallery(newGallery.join(", "));
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: "-8px",
                                    right: "-8px",
                                    background: "#fff",
                                    border: "1px solid #ccc",
                                    borderRadius: "50%",
                                    width: "22px",
                                    height: "22px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "bold",
                                    color: "#d32f2f",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                    zIndex: 2,
                                  }}
                                  aria-label="Remove image"
                                >
                                  &minus;
                                </button>
                              </div>
                            ))}
                        </InlineStack>
                      </BlockStack>
                    )}

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

                    <TextField
                      label="Custom Liquid Code"
                      name="customCode"
                      value={customCode}
                      onChange={setCustomCode}
                      multiline={10}
                      autoComplete="off"
                      helpText="Paste the full Liquid code for this section"
                    />

                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Section Flags
                      </Text>
                      <Checkbox
                        label="Popular section"
                        checked={isPopular}
                        onChange={(checked) => setIsPopular(checked)}
                      />
                      <input
                        type="hidden"
                        name="isPopular"
                        value={isPopular ? "true" : "false"}
                      />
                      <Checkbox
                        label="Trending section"
                        checked={isTrending}
                        onChange={(checked) => setIsTrending(checked)}
                      />
                      <input
                        type="hidden"
                        name="isTrending"
                        value={isTrending ? "true" : "false"}
                      />
                      <Checkbox
                        label="Featured section"
                        checked={isFeatured}
                        onChange={(checked) => setIsFeatured(checked)}
                      />
                      <input
                        type="hidden"
                        name="isFeatured"
                        value={isFeatured ? "true" : "false"}
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
                        <Card padding="400" >
                          <BlockStack gap="300">
                            {section.thumbnailUrl && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                <img
                                  src={section.thumbnailUrl}
                                  alt={section.name}
                                  style={{
                                    width: "100%",
                                    height: "120px",
                                    borderRadius: "8px",
                                    objectFit: "contain",
                                    background: "#f6f6f7",
                                    display: "block",
                                  }}
                                />
                              </div>
                            )}

                            <BlockStack gap="200">
                              <Text as="h3" variant="headingMd" truncate>
                                {section.name}
                              </Text>
                              <InlineStack gap="100">
                                <Badge size="small" tone="info">
                                  {section.category}
                                </Badge>
                              </InlineStack>

                              {section.tags && section.tags.length > 0 && (
                                <InlineStack gap="100">
                                  {section.tags
                                    .slice(0, 2)
                                    .map((tag: string, index: number) => (
                                      <Tag key={index}>{tag}</Tag>
                                    ))}
                                  {section.tags.length > 2 && (
                                    <Text as="span" tone="subdued">
                                      +{section.tags.length - 2}
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
