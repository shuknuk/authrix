import { getNotionConfig, isNotionConfigured } from "@/lib/notion/service";
import { areExternalWritesEnabled, getExternalWritePolicyMessage } from "@/lib/security/config";
import type { ApprovalRequest } from "@/types/domain";

interface ExecutionResult {
  success: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function executeNotionDocsUpdate(
  approval: ApprovalRequest
): Promise<ExecutionResult> {
  if (approval.actionKind !== "docs.update") {
    return {
      success: false,
      message: `No Notion adapter is registered for "${approval.actionKind}".`,
    };
  }

  if (!isNotionConfigured()) {
    return {
      success: false,
      message: "Notion publishing is not configured for this workspace.",
    };
  }

  if (!areExternalWritesEnabled()) {
    return {
      success: false,
      message: getExternalWritePolicyMessage("Notion"),
      metadata: {
        policyBlocked: true,
        policy: "external-write-policy",
        target: "Notion",
      },
    };
  }

  const notion = getNotionConfig();
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notion.token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: {
        type: "page_id",
        page_id: notion.parentPageId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: approval.title,
              },
            },
          ],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: approval.description,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `Approval id: ${approval.id}`,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `Source agent: ${approval.sourceAgent}`,
                },
              },
            ],
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = truncateRemoteError(await response.text());
    return {
      success: false,
      message: `Notion page creation failed with ${response.status}. ${text}`.trim(),
    };
  }

  const page = (await response.json()) as {
    id?: string;
    url?: string;
  };

  return {
    success: true,
    message: `Documentation update published to Notion${page.url ? `: ${page.url}` : "."}`,
    metadata: {
      pageId: page.id,
      pageUrl: page.url,
    },
  };
}

function truncateRemoteError(value: string): string {
  return value.length > 500 ? `${value.slice(0, 497)}...` : value;
}
