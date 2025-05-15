import { execSync } from "child_process";
import { config } from "dotenv";

config({ path: '.env.test' });

beforeAll(() => {
    console.log("Running Integration test project setup...");
    try {
        execSync("npx prisma db push --force-reset", {
            stdio: "inherit"
        });
    } catch (err) {
        console.error("Failed to run initialisation ")
    }
})