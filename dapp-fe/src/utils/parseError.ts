/**
 * Shorten error messages from ethers / MetaMask / BE into user-friendly text.
 */
export function parseError(err: unknown): string {
  if (!(err instanceof Error)) return "An unknown error occurred.";

  const msg = err.message?.toLowerCase() ?? "";

  // User rejected signing / transaction on MetaMask
  if (
    msg.includes("user rejected") ||
    msg.includes("user denied") ||
    msg.includes("action_rejected")
  ) {
    return "You rejected the transaction in your wallet.";
  }

  // Insufficient gas / funds
  if (msg.includes("insufficient funds")) {
    return "Insufficient balance to complete the transaction.";
  }

  // Transaction reverted on-chain
  if (msg.includes("execution reverted")) {
    // Try to extract the revert reason if available
    const reasonMatch = msg.match(/reason="([^"]+)"/);
    if (reasonMatch) return `Transaction failed: ${reasonMatch[1]}`;
    return "The smart contract rejected the transaction.";
  }

  // Timeout / network
  if (msg.includes("timeout") || msg.includes("network")) {
    return "Network error. Please try again.";
  }

  // If the message is short (< 120 chars), keep it (often from BE)
  if (err.message.length < 120) return err.message;

  // Otherwise (message too long), shorten it
  return "Transaction failed. Please try again.";
}