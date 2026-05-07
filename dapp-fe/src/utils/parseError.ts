/**
 * Rút gọn error message từ ethers / MetaMask / BE thành câu thân thiện.
 */
export function parseError(err: unknown): string {
  if (!(err instanceof Error)) return "Đã xảy ra lỗi không xác định.";

  const msg = err.message?.toLowerCase() ?? "";

  // User từ chối ký / giao dịch trên MetaMask
  if (
    msg.includes("user rejected") ||
    msg.includes("user denied") ||
    msg.includes("action_rejected")
  ) {
    return "Bạn đã từ chối giao dịch trên ví.";
  }

  // Không đủ gas / tiền
  if (msg.includes("insufficient funds")) {
    return "Số dư không đủ để thực hiện giao dịch.";
  }

  // Giao dịch bị revert trên chain
  if (msg.includes("execution reverted")) {
    // Cố trích reason nếu có
    const reasonMatch = msg.match(/reason="([^"]+)"/);
    if (reasonMatch) return `Giao dịch thất bại: ${reasonMatch[1]}`;
    return "Giao dịch bị từ chối bởi smart contract.";
  }

  // Timeout / network
  if (msg.includes("timeout") || msg.includes("network")) {
    return "Lỗi kết nối mạng. Vui lòng thử lại.";
  }

  // Nếu message ngắn gọn (< 120 ký tự) → giữ nguyên (thường là lỗi từ BE)
  if (err.message.length < 120) return err.message;

  // Còn lại (message quá dài) → cắt ngắn
  return "Giao dịch thất bại. Vui lòng thử lại.";
}