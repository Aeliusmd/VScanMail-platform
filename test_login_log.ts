import "dotenv/config";
import { auditService } from './lib/modules/audit/audit.service';

async function testResilience() {
  console.log("Testing audit logging resilience with a very long entity ID...");
  
  // This string is 100 characters long, well beyond the 36-char limit of entity_id column
  const longIdentifier = "this-is-a-very-long-email-address-that-exceeds-the-thirty-six-character-limit-of-the-database-column";
  
  try {
    // Test Case 1: Long identifier (should log error but not throw)
    await auditService.log({
      actor: "system",
      action: "test.resilience",
      entity: longIdentifier,
      req: {
        headers: new Headers(),
        ip: "127.0.0.1"
      } as any
    });
    console.log("SUCCESS: Case 1 (Long ID) did not crash.");

    // Test Case 2: Missing request object (should use defaults and not crash)
    await auditService.log({
      actor: "system",
      action: "test.null_req",
      entity: "test-id",
      req: undefined
    });
    console.log("SUCCESS: Case 2 (Null Req) did not crash.");

  } catch (err) {
    console.error("FAILURE: auditService.log threw an error:", err);
    process.exit(1);
  }
  
  process.exit(0);
}

testResilience();
