import { Client } from "@notionhq/client";

const PROJECTS_DB_ID = "2c384fd7-bc4e-81be-8282-edac5fb7e102";

export async function createClientInNotion(params: {
  businessName: string;
  currency: string;
}): Promise<string> {
  const notion = new Client({ auth: process.env.NOTION_TOKEN?.trim() });

  const page = await notion.pages.create({
    parent: { database_id: PROJECTS_DB_ID },
    properties: {
      Project: {
        title: [{ text: { content: params.businessName } }],
      },
      Client: {
        checkbox: true,
      },
      Status: {
        status: { name: "In Progress" },
      },
      Currency: {
        select: { name: params.currency },
      },
    },
  });

  return page.id;
}
