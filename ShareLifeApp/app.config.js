import "dotenv/config";

export default ({ config }) => {
  return {
    ...config,
    extra: {
      apiUrl: process.env.REACT_APP_API_URL || "http://localhost:3000",
    },
  };
};
