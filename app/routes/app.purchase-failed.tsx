// app/routes/app.purchase-failed.tsx
import { LoaderFunction } from "@remix-run/node";
import { authenticate } from "app/shopify.server";

export const loader: LoaderFunction = async ({ request }) => {
  await authenticate.admin(request);
  return {};
};

export default function PurchaseFailed() {
  return (
    <div className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Purchase Failed
          </h1>
          <p className="text-gray-600 mb-6">
            There was an issue processing your purchase. Please try again or
            contact support if the problem persists.
          </p>
        </div>
        <div className="space-y-3">
          <a
            href="/app"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </a>
          <a
            href="/app/sections"
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    </div>
  );
}
