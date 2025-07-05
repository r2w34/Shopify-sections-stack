"use client";

import type React from "react";

import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Button,
  Badge,
  InlineStack,
  BlockStack,
  Frame,
  Grid,
  Modal,
  Icon,
  Tag,
} from "@shopify/polaris";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigate } from "@remix-run/react";
import { useState, useCallback, useMemo } from "react";
import { SearchIcon, StarIcon } from "@shopify/polaris-icons";
import SectionModel from "app/models/SectionModel";
import { connectToDB } from "app/db.server";

// Add this type definition at the top of the file
type SerializedSection = {
  _id: string;
  name: string;
  identifier: string;
  description: string;
  detailedFeatures: string[];
  category: string;
  tags: string[];
  thumbnailUrl: string;
  imageGallery: string[];
  price: number;
  filePath: string;
  isFree: boolean;
  isPopular: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  demoUrl: string;
  createdAt: string;
  updatedAt: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  // console.log("🔍 [LOADER] Starting section store data fetch...");

  await connectToDB();
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || "all";
  const search = url.searchParams.get("search") || "";

  // console.log("🔍 [LOADER] Query params:", { category, search });

  const query: any = {};

  // Filter by category
  if (category === "free") {
    query.isFree = true;
  } else if (category === "paid") {
    query.isFree = false;
  } else if (category === "popular") {
    query.isPopular = true;
  } else if (category === "trending") {
    query.isTrending = true;
  } else if (category === "featured") {
    query.isFeatured = true;
  } else if (category !== "all" && category !== "newest") {
    query.category = category;
  }

  // Search functionality - now includes tags
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { identifier: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  // console.log("🔍 [LOADER] MongoDB query:", JSON.stringify(query, null, 2));

  const sections = await SectionModel.find(query)
    .sort({ createdAt: -1 })
    .lean();

  // console.log("🔍 [LOADER] Raw sections from DB:", sections.length);
  // console.log(
  //   "🔍 [LOADER] First section sample:",
  //   sections[0]
  //     ? {
  //         name: sections[0].name,
  //         category: sections[0].category,
  //         tags: sections[0].tags,
  //         detailedFeatures: sections[0].detailedFeatures,
  //         imageGallery: sections[0].imageGallery,
  //         thumbnailUrl: sections[0].thumbnailUrl,
  //       }
  //     : "No sections found",
  // );

  // Transform the data to ensure proper typing
  const transformedSections = sections.map((section: any) => ({
    _id: section._id.toString(),
    name: section.name,
    identifier: section.identifier,
    description: section.description || "",
    detailedFeatures: section.detailedFeatures || [],
    category: section.category || "other",
    tags: section.tags || [],
    thumbnailUrl: section.thumbnailUrl || "",
    imageGallery: section.imageGallery || [],
    price: section.price || 0,
    filePath: section.filePath,
    isFree: section.isFree,
    isPopular: section.isPopular || false,
    isTrending: section.isTrending || false,
    isFeatured: section.isFeatured || false,
    demoUrl: section.demoUrl || "",
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
  }));

  // console.log("🔍 [LOADER] Transformed sections:", transformedSections.length);
 

  return json({ sections: transformedSections, category, search });
}

const categories = [
  { id: "all", label: "All", icon: null },
  { id: "popular", label: "Popular", icon: StarIcon },
  { id: "trending", label: "Trending", icon: null },
  { id: "newest", label: "Newest", icon: null },
  { id: "free", label: "Free", icon: null },
  { id: "featured", label: "Featured", icon: null },
  { id: "testimonial", label: "Testimonial", icon: null },
  { id: "scrolling", label: "Scrolling", icon: null },
  { id: "hero", label: "Hero", icon: null },
  { id: "video", label: "Video", icon: null },
  { id: "text", label: "Text", icon: null },
  { id: "images", label: "Images", icon: null },
  { id: "snippet", label: "Snippet", icon: null },
  { id: "countdown", label: "Countdown", icon: null },
];

export default function SectionStorePage() {
  const { sections, category, search } = useLoaderData<typeof loader>() as any;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // console.log("🎨 [COMPONENT] Received sections:", sections.length);
  // console.log("🎨 [COMPONENT] Current category:", category);
  // console.log("🎨 [COMPONENT] Current search:", search);

  const [selectedSection, setSelectedSection] =
    useState<SerializedSection | null>(null);
  const [searchValue, setSearchValue] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleCategoryChange = useCallback(
    (newCategory: string) => {
      // console.log("🔄 [CATEGORY] Changing to:", newCategory);
      setSelectedCategory(newCategory);
      const params = new URLSearchParams(searchParams);
      if (newCategory === "all") {
        params.delete("category");
      } else {
        params.set("category", newCategory);
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      // console.log("🔍 [SEARCH] Search value changed:", value);
      setSearchValue(value);

      const timeoutId = setTimeout(() => {
        const params = new URLSearchParams(searchParams);
        if (value.trim()) {
          params.set("search", value.trim());
        } else {
          params.delete("search");
        }
        setSearchParams(params);
      }, 500);

      return () => clearTimeout(timeoutId);
    },
    [searchParams, setSearchParams],
  );

  const handleSearchSubmit = useCallback(() => {
    // console.log("🔍 [SEARCH] Manual search submit:", searchValue);
    const params = new URLSearchParams(searchParams);
    if (searchValue) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  }, [searchValue, searchParams, setSearchParams]);

  const handleSectionClick = useCallback((section: SerializedSection) => {
    
    setSelectedSection(section);
    setCurrentImageIndex(0); // Reset image slider
  }, []);

  const handleCloseModal = useCallback(() => {
    // console.log("🖱️ [MODAL] Closing modal");
    setSelectedSection(null);
    setCurrentImageIndex(0);
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearchSubmit();
      }
    },
    [handleSearchSubmit],
  );

  // Create image array for slider (thumbnail first, then gallery images)
  const getImageArray = useCallback((section: SerializedSection) => {
    const images = [];
    if (section.thumbnailUrl) {
      images.push(section.thumbnailUrl);
    }
    if (section.imageGallery && section.imageGallery.length > 0) {
      images.push(...section.imageGallery);
    }
    return images;
  }, []);

  const handlePrevImage = useCallback(() => {
    if (selectedSection) {
      const images = getImageArray(selectedSection);
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1,
      );
    }
  }, [selectedSection, getImageArray]);

  const handleNextImage = useCallback(() => {
    if (selectedSection) {
      const images = getImageArray(selectedSection);
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1,
      );
    }
  }, [selectedSection, getImageArray]);

  const filteredSections = useMemo(() => {
    const filtered = sections.filter((section: SerializedSection) => {
      if (selectedCategory === "free") return section.isFree;
      if (selectedCategory === "paid") return !section.isFree;
      if (selectedCategory === "popular") return section.isPopular;
      if (selectedCategory === "trending") return section.isTrending;
      if (selectedCategory === "newest") return true;
      if (selectedCategory === "featured") return section.isFeatured;
      if (selectedCategory !== "all")
        return section.category === selectedCategory;
      return true;
    });

   
    return filtered;
  }, [sections, selectedCategory]);

  return (
    <Frame>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card padding="0">
              <div
                style={{ padding: "20px", borderBottom: "1px solid #e1e3e5" }}
              >
                <BlockStack gap="400">
                  <Text as="h1" variant="headingXl">
                    🛍️ Section Store
                  </Text>

                  <div style={{ maxWidth: "400px" }}>
                    <TextField
                      label=""
                      value={searchValue}
                      onChange={handleSearchChange}
                      placeholder="Search for sections"
                      prefix={<Icon source={SearchIcon} />}
                      connectedRight={
                        <Button onClick={handleSearchSubmit}>Search</Button>
                      }
                      autoComplete="off"
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {categories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={
                          selectedCategory === cat.id ? "primary" : "tertiary"
                        }
                        size="slim"
                        onClick={() => handleCategoryChange(cat.id)}
                        icon={cat.icon ? cat.icon : undefined}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </BlockStack>
              </div>

              <div style={{ padding: "20px" }}>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingLg">
                      {selectedCategory === "all"
                        ? "All Sections"
                        : selectedCategory.charAt(0).toUpperCase() +
                          selectedCategory.slice(1)}
                    </Text>
                    <Text as="p" tone="subdued">
                      {filteredSections.length} sections
                    </Text>
                  </InlineStack>

                  {filteredSections.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <Text as="p" tone="subdued">
                        No sections found. Try adjusting your search or category
                        filter.
                      </Text>
                    </div>
                  ) : (
                    <Grid>
                      {filteredSections.map((section: SerializedSection) => (
                        <Grid.Cell
                          key={section._id}
                          columnSpan={{ xs: 6, sm: 3, md: 2, lg: 2, xl: 2 }}
                        >
                          <Card padding="0">
                            <div
                              style={{
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                              }}
                              onClick={() => handleSectionClick(section)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              <div style={{ position: "relative" }}>
                                {section.thumbnailUrl ? (
                                  <img
                                    src={
                                      section.thumbnailUrl || "/placeholder.svg"
                                    }
                                    alt={section.name}
                                    style={{
                                      width: "100%",
                                      height: "200px",
                                      objectFit: "cover",
                                      borderRadius: "8px 8px 0 0",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "200px",
                                      backgroundColor: "#f6f6f7",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      borderRadius: "8px 8px 0 0",
                                    }}
                                  >
                                    <Text as="p" tone="subdued">
                                      No Preview
                                    </Text>
                                  </div>
                                )}

                                <div
                                  style={{
                                    position: "absolute",
                                    top: "8px",
                                    right: "8px",
                                  }}
                                >
                                  <Badge
                                    tone={
                                      section.isFree ? "success" : "attention"
                                    }
                                  >
                                    {section.isFree
                                      ? "Free"
                                      : `$${section.price}`}
                                  </Badge>
                                </div>

                                {/* Category badge */}
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "8px",
                                    left: "8px",
                                  }}
                                >
                                  <Badge tone="info">{section.category}</Badge>
                                </div>
                              </div>

                              <div style={{ padding: "16px" }}>
                                <BlockStack gap="200">
                                  <Text as="h3" variant="headingMd" truncate>
                                    {section.name}
                                  </Text>
                                  <Text as="p" tone="subdued" truncate>
                                    {section.identifier}
                                  </Text>
                                  {section.description && (
                                    <Text as="p" tone="subdued">
                                      {section.description.length > 80
                                        ? `${section.description.substring(0, 80)}...`
                                        : section.description}
                                    </Text>
                                  )}

                                  {/* Show first few tags */}
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
                                </BlockStack>
                              </div>
                            </div>
                          </Card>
                        </Grid.Cell>
                      ))}
                    </Grid>
                  )}
                </BlockStack>
              </div>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Enhanced Section Detail Modal - New Design */}
        {selectedSection && (
          <Modal
            open={!!selectedSection}
            onClose={handleCloseModal}
            title=""
            size="large"
            noScroll
          >
            <div
              style={{
                display: "flex",
                minHeight: "600px",
                backgroundColor: "#f6f6f7",
              }}
            >
              {/* Left Side - Image Slider */}
              <div
                style={{
                  flex: "1",
                  padding: "40px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {/* Main Image */}
                <div style={{ position: "relative", marginBottom: "20px" }}>
                  {(() => {
                    const images = getImageArray(selectedSection);
                    const currentImage = images[currentImageIndex];

                    return currentImage ? (
                      <>
                        <img
                          src={currentImage || "/placeholder.svg"}
                          alt={`${selectedSection.name} ${currentImageIndex + 1}`}
                          style={{
                            width: "400px",
                            height: "300px",
                            objectFit: "cover",
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />

                        {/* Image counter overlay */}
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background: "rgba(0,0,0,0.7)",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {currentImageIndex + 1} / {images.length}
                        </div>

                        {/* Navigation arrows */}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={handlePrevImage}
                              style={{
                                position: "absolute",
                                left: "-20px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px",
                              }}
                            >
                              ‹
                            </button>
                            <button
                              onClick={handleNextImage}
                              style={{
                                position: "absolute",
                                right: "-20px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px",
                              }}
                            >
                              ›
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div
                        style={{
                          width: "400px",
                          height: "300px",
                          backgroundColor: "#e1e3e5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "12px",
                        }}
                      >
                        <Text as="p" tone="subdued">
                          No Preview Available
                        </Text>
                      </div>
                    );
                  })()}
                </div>

                {/* Thumbnail Strip */}
                {(() => {
                  const images = getImageArray(selectedSection);
                  return (
                    images.length > 1 && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        {images.map((imageUrl: string, index: number) => (
                          <div
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            style={{
                              cursor: "pointer",
                              border:
                                currentImageIndex === index
                                  ? "3px solid #008060"
                                  : "3px solid transparent",
                              borderRadius: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={imageUrl || "/placeholder.svg"}
                              alt={`${selectedSection.name} thumbnail ${index + 1}`}
                              style={{
                                width: "60px",
                                height: "45px",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  );
                })()}
              </div>

              {/* Right Side - Details Panel */}
              <div
                style={{
                  width: "400px",
                  backgroundColor: "white",
                  padding: "32px",
                  borderRadius: "0 8px 8px 0",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Close button */}
                <button
                  onClick={handleCloseModal}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#6d7175",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* Title and Identifier */}
                  <div>
                    <Text as="h2" variant="headingLg">
                      {selectedSection.name}
                    </Text>
                    <Text as="p" tone="subdued">
                      {selectedSection.identifier}
                    </Text>
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {selectedSection.category}
                    </span>
                  </div>

                  {/* Price */}
                  <div>
                    <Text as="h3" variant="headingLg">
                      {selectedSection.isFree
                        ? "Free"
                        : `$${selectedSection.price}`}
                    </Text>
                  </div>

                  {/* Description */}
                  {selectedSection.description && (
                    <div>
                      <Text as="h4" variant="headingSm">
                        Description:
                      </Text>
                      <Text as="p">{selectedSection.description}</Text>
                    </div>
                  )}

                  {/* Features */}
                  {selectedSection.detailedFeatures &&
                    selectedSection.detailedFeatures.length > 0 && (
                      <div>
                        <Text as="h4" variant="headingSm">
                          Features:
                        </Text>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {selectedSection.detailedFeatures.map(
                            (feature: string, index: number) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#4caf50",
                                    fontSize: "16px",
                                    marginTop: "2px",
                                    minWidth: "16px",
                                  }}
                                >
                                  ✓
                                </span>
                                <Text as="p">{feature}</Text>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Tags */}
                  {selectedSection.tags && selectedSection.tags.length > 0 && (
                    <div>
                      <Text as="h4" variant="headingSm">
                        Tags:
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {selectedSection.tags.map(
                          (tag: string, index: number) => (
                            <span
                              key={index}
                              style={{
                                backgroundColor: "#f5f5f5",
                                color: "#333",
                                padding: "4px 12px",
                                borderRadius: "16px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {tag}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ marginTop: "auto", paddingTop: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <button
                        style={{
                          width: "100%",
                          padding: "14px",
                          backgroundColor: selectedSection.isFree
                            ? "#6d7175"
                            : "#2c2c2c",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "16px",
                          fontWeight: "600",
                          cursor: selectedSection.isFree
                            ? "not-allowed"
                            : "pointer",
                          opacity: selectedSection.isFree ? 0.6 : 1,
                        }}
                        disabled={selectedSection.isFree}
                        onClick={async () => {
                          const res = await fetch("/api/purchase-section", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              sectionId: selectedSection._id,
                            }),
                          });

                          const data = await res.json();
                          if (data.confirmationUrl) {
                            if (window.top) {
                              window.top.location.href = data.confirmationUrl;
                            } else {
                              window.location.href = data.confirmationUrl;
                            }
                          } else {
                            alert("Error: " + JSON.stringify(data.error));
                          }
                        }}
                      >
                        Purchase section
                      </button>

                      {selectedSection.demoUrl && (
                        <button
                          onClick={() =>
                            window.open(selectedSection.demoUrl, "_blank")
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            backgroundColor: "transparent",
                            color: "#333",
                            border: "1px solid #e1e3e5",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                          }}
                        >
                          View Demo Store
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </Page>
    </Frame>
  );
}
