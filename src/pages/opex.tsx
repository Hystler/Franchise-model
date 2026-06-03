export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/store-model#opex",
      permanent: false
    }
  };
}

export default function OpexRedirect() {
  return null;
}
