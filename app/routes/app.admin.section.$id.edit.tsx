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
  Banner,
  BlockStack,
  DropZone,
  Thumbnail,
  Frame,
  Checkbox,
  Tag,
  InlineStack,
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
} from "@remix-run/react";
import { useState } from "react";
import SectionModel from "app/models/SectionModel";
import SectionContentModel from "app/models/sectionContentModel";
import { connectToDB } from "app/db.server";
import { requireAdmin } from "app/utils/requireAdmin";

export async function loader({ params, request }: LoaderFunctionArgs) {
  await connectToDB();
  await requireAdmin(request);
  const sectionId = params.id;

  if (!sectionId) {
    throw new Response("Section ID is required", { status: 400 });
  }

  const section = (await SectionModel.findById(sectionId).lean()) as any;
  const sectionContent = (await SectionContentModel.findOne({ sectionId }).lean()) as any;

  if (!section) {
    throw new Response("Section not found", { status: 404 });
  }

  return json({ section, sectionContent });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await connectToDB();
  await requireAdmin(request);
  const sectionId = params.id;
  const formData = await request.formData();

  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const category = formData.get("category")?.toString();
  const type = formData.get("type")?.toString();
  const price = Number.parseFloat(formData.get("price")?.toString() || "0");
  const thumbnailUrl = formData.get("thumbnailUrl")?.toString();
  const isPopular = formData.get("isPopular") === "on";
  const isTrending = formData.get("isTrending") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
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
    // Update the section
    await SectionModel.findByIdAndUpdate(sectionId, {
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

    // Update the section content if custom code is provided
    if (customCode.trim().length > 0) {
      await SectionContentModel.findOneAndUpdate(
        { sectionId },
        { content: customCode },
        { upsert: true }
      );
    }

    return redirect("/app/admin/sections");
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}

export default function EditSectionPage() {
  const { section, sectionContent } = useLoaderData<typeof loader>();
  const actionData = useActionData() as any;
  const navigate = useNavigate();

  // Form states
  const [type, setType] = useState(section.isFree ? "free" : "paid");
  const [name, setName] = useState(section.name || "");
  const [description, setDescription] = useState(section.description || "");
  const [category, setCategory] = useState(section.category || "");
  const [price, setPrice] = useState(section.price?.toString() || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(section.thumbnailUrl || "");
  const [detailedFeatures, setDetailedFeatures] = useState(
    section.detailedFeatures ? section.detailedFeatures.join("\n") : "",
  );
  const [tags, setTags] = useState(section.tags ? section.tags.join(", ") : "");
  const [imageGallery, setImageGallery] = useState(
    section.imageGallery ? section.imageGallery.join(", ") : "",
  );
  const [isPopular, setIsPopular] = useState(section.isPopular || false);
  const [isTrending, setIsTrending] = useState(section.isTrending || false);
  const [isFeatured, setIsFeatured] = useState(section.isFeatured || false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [customCode, setCustomCode] = useState(sectionContent?.content || "");

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
    } finally {
      setUploading(false);
    }
  };

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
                      ) : thumbnailUrl ? (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "16px",
                          }}
                        >
                          <Thumbnail
                            size="large"
                            alt="Current thumbnail"
                            source={thumbnailUrl}
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
                          }
                        }
                        // Merge with any existing images
                        const existing = imageGallery
                          ? imageGallery.split(",").map((url: string) => url.trim())
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
                            .map((url: string) => url.trim())
                            .filter((url: string) => Boolean(url))
                            .map((url: string, index: number, arr: string[]) => (
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
                                    const newGallery = arr.filter((_: string, i: number) => i !== index);
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
                    <strong>Section ID:</strong> {section._id}
                  </Text>
                  <Text as="p">
                    <strong>Created:</strong>{" "}
                    {new Date(section.createdAt).toLocaleDateString()}
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
  );
}
