import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const purchased = url.searchParams.get("purchased");

  return { purchased: purchased === "true" };
};

export default function ThankYou() {
  const { purchased } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">
        {purchased ? "Thank You for Your Purchase!" : "Thank You!"}
      </h1>
      <p className="text-gray-600">
        {purchased
          ? "Your section has been purchased successfully. It will be available in your account shortly."
          : "Your request has been processed."}
      </p>
    </div>
  );
}
