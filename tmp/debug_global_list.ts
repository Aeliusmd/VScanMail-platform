import { mailItemModel } from "../lib/modules/records/mail.model";

async function test() {
  try {
    console.log("Testing mailItemModel.listAllGlobal()...");
    const result = await mailItemModel.listAllGlobal({ page: 1, limit: 10 });
    console.log("Success! Items count:", result.items.length);
    console.log("Total:", result.total);
    process.exit(0);
  } catch (err) {
    console.error("FAILED with error:");
    console.error(err);
    process.exit(1);
  }
}

test();
