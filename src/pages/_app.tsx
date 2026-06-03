import type { AppProps } from "next/app";
import Head from "next/head";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const description =
    "Премиальная финансовая модель для расчёта экономики точки, SKU, CAPEX, OPEX, EBITDA, cashflow, payback, ROI и сценариев масштабирования франшизы.";

  return (
    <>
      <Head>
        <title>Franchise Model — финансовая модель франшизы</title>
        <meta name="description" content={description} />
        <meta name="application-name" content="Franchise Model" />
        <meta name="theme-color" content="#0B0A08" />
        <meta property="og:title" content="Franchise Model — финансовая модель франшизы" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://franchise-model-three.vercel.app/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Franchise Model — финансовая модель франшизы" />
        <meta name="twitter:description" content={description} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
