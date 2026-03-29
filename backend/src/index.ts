import "dotenv/config";
import { app } from "./app";

const PORT = parseInt(process.env.PORT || "4000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Upcreate API running on port ${PORT}`);
});
