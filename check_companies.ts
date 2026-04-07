import { db, sql } from './lib/modules/core/db/mysql';
import { clients } from './lib/modules/core/db/schema';

async function checkCompanies() {
  try {
    const allClients = await db.select().from(clients);
    console.log("Total companies:", allClients.length);
    
    const subscription = allClients.filter(c => c.clientType === 'subscription');
    const manual = allClients.filter(c => c.clientType === 'manual');
    
    console.log("Subscription companies:", subscription.length);
    console.log("Manual companies:", manual.length);
    
    // Print details of first 5
    console.log("\nSample Companies:");
    allClients.slice(0, 5).forEach(c => {
      console.log(`- ${c.companyName} (${c.clientType}) status: ${c.status}`);
    });
    
  } catch (error) {
    console.error("Failed to check companies:", error);
  } finally {
    process.exit(0);
  }
}

checkCompanies();
