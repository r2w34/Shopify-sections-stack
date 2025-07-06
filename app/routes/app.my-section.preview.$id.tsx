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
  Divider,
} from "@shopify/polaris";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalIcon,
  CashDollarIcon,
  RefreshIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { connectToDB } from "app/db.server";
import SectionModel from "app/models/SectionModel";
import { authenticate } from "app/shopify.server";
import { useState } from "react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  await connectToDB();

  const { admin } = await authenticate.admin(request);

  const section = (await SectionModel.findById(params.id).lean()) as any;
  if (!section) {
    throw new Response("Not Found", { status: 404 });
  }

  // Fetch current themes from Shopify
  let themes = [];
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
    if (!jsonData.errors) {
      themes = jsonData.data.themes.edges.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        role: edge.node.role,
      }));
    }
  } catch (error) {
    console.error("Error fetching themes:", error);
  }

  return json({
    section: {
      _id: section._id.toString(),
      name: section.name,
      description: section.description,
      detailedFeatures: section.detailedFeatures || [],
      category: section.category,
      thumbnailUrl: section.thumbnailUrl,
      imageGallery: section.imageGallery || [],
      price: section.price,
      isFree: section.isFree,
      isPopular: section.isPopular,
      isTrending: section.isTrending,
      isFeatured: section.isFeatured,
      downloadCount: section.downloadCount,
      rating: section.rating,
      demoUrl: section.demoUrl,
      tags: section.tags || [],
    },
    themes,
  });
}

export default function PreviewSectionPage() {
  const { section, themes } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images =
    section.imageGallery.length > 0
      ? section.imageGallery
      : [section.thumbnailUrl].filter(Boolean);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Page
      title={section.name}
      backAction={{
        content: "My sections",
        onAction: () => navigate("/app"),
      }}
    >
      <Layout>
        <Layout.Section variant="oneHalf">
          <BlockStack gap="400">
            {/* Image Carousel */}
            {images.length > 0 && (
              <Card padding="0">
                <div style={{ position: "relative" }}>
                  {/* Main Image */}
                  <div
                    style={{
                      width: "100%",
                      height: "400px",
                      backgroundColor: "#f6f6f7",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={images[currentImageIndex] || "/placeholder.svg"}
                      alt={section.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 2,
                          }}
                        >
                          <Button
                            icon={ChevronLeftIcon}
                            onClick={prevImage}
                            variant="primary"
                            size="slim"
                            accessibilityLabel="Previous image"
                          />
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 2,
                          }}
                        >
                          <Button
                            icon={ChevronRightIcon}
                            onClick={nextImage}
                            variant="primary"
                            size="slim"
                            accessibilityLabel="Next image"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Dots Indicator */}
                  {images.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "16px",
                      }}
                    >
                      {images.map((_: any, index: any) => (
                        <div
                          key={index}
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor:
                              index === currentImageIndex ? "#000" : "#ccc",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                          }}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Details Section */}
            <Card padding="400">
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Details:
                </Text>
                <Text as="p" tone="subdued">
                  {section.detailedFeatures &&
                  section.detailedFeatures.length > 0
                    ? section.detailedFeatures.join(", ")
                    : "Colors, link, text, sizes etc can be customised"}
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <BlockStack gap="400">
            {/* Section Info Card */}
            <Card padding="400">
              <BlockStack inlineAlign="start" gap="400" align="start">
                <Text as="h2" variant="headingLg">
                  {section.name}
                </Text>

                <Badge
                  size="small"
                  tone={section.isFree ? "success" : "attention"}
                >
                  {section.isFree ? "Free" : `$${section.price}`}
                </Badge>

                <BlockStack inlineAlign="start" gap="300">
                  <InlineStack gap="300" blockAlign="start">
                    <Icon source={CashDollarIcon} tone="base" />
                    <Text as="p">No recurring fees</Text>
                  </InlineStack>
                  <InlineStack gap="300" blockAlign="start">
                    <Icon source={RefreshIcon} tone="base" />
                    <Text as="p">Lifetime access & free updates</Text>
                  </InlineStack>
                  <InlineStack gap="300" blockAlign="start">
                    <Icon source={SettingsIcon} tone="base" />
                    <Text as="p">Works with any Shopify theme</Text>
                  </InlineStack>
                </BlockStack>

                {section.rating > 0 && (
                  <Text as="p" tone="subdued" alignment="center">
                    Rating: {section.rating}/5 ⭐ ({section.downloadCount}{" "}
                    downloads)
                  </Text>
                )}
              </BlockStack>
            </Card>

            {/* Category & Tags */}
            {(section.category ||
              (section.tags && section.tags.length > 0)) && (
              <Card padding="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Category & Tags
                  </Text>
                  {section.category && (
                    <InlineStack gap="200">
                      <Text as="span">Category:</Text>
                      <Badge>{section.category}</Badge>
                    </InlineStack>
                  )}
                  {section.tags && section.tags.length > 0 && (
                    <BlockStack gap="200">
                      <Text as="span">Tags:</Text>
                      <InlineStack gap="200">
                        {section.tags.map((tag: string, index: number) => (
                          <Badge key={index} tone="info">
                            {tag}
                          </Badge>
                        ))}
                      </InlineStack>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
            )}

            {/* Description */}
            <Card padding="400">
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Description
                </Text>
                <Text as="p">{section.description}</Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
