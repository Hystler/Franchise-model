export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/store-model#sensitivity",
      permanent: false
    }
  };
}

export default function SensitivityRedirect() {
  return null;
}
