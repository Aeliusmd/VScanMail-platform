export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNodeHandlers } = await import("./instrumentation.node");
    registerNodeHandlers();
  }
}
