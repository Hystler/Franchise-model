export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/store-model#capex",
      permanent: false
    }
  };
}

export default function CapexRedirect() {
  return null;
}
