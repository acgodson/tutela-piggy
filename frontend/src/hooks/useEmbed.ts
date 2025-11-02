import { useCallback } from "react";

export const useEmbed = () => {
  const generateEmbedCode = useCallback(() => {
    const topicId = process.env.NEXT_PUBLIC_HEDERA_TOPIC_ID;
    const farmId = process.env.NEXT_PUBLIC_FARM_ID;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const embedUrl = `${baseUrl}/embed?topic=${topicId}&farm=${farmId}`;

    return `<iframe
  src="${embedUrl}"
  width="800"
  height="600"
  frameborder="0"
  allow="camera; microphone"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
></iframe>`;
  }, []);

  const getDirectUrl = useCallback(() => {
    const topicId = process.env.NEXT_PUBLIC_HEDERA_TOPIC_ID;
    const farmId = process.env.NEXT_PUBLIC_FARM_ID;
    return `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/embed?topic=${topicId}&farm=${farmId}`;
  }, []);

  const getTopicId = useCallback(() => {
    return process.env.NEXT_PUBLIC_HEDERA_TOPIC_ID;
  }, []);

  const getFarmId = useCallback(() => {
    return process.env.NEXT_PUBLIC_FARM_ID;
  }, []);

  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copied to clipboard!`);
  }, []);

  return {
    generateEmbedCode,
    getDirectUrl,
    getTopicId,
    getFarmId,
    copyToClipboard,
  };
};
