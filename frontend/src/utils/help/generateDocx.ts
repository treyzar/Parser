import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
} from "docx";
import type {
  IEditorElement,
  ITextProperties,
  ITableProperties,
  ISignatureProperties,
  IDividerProperties,
} from "../types/editor.types";

export async function generateDocx(
  elements: IEditorElement[],
  title: string,
  description: string
): Promise<Blob> {
  const sections: any[] = [];

  if (title) {
    sections.push({
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  }

  if (description) {
    sections.push({
      properties: {},
      children: [
        new Paragraph({ text: description, style: "Subtitle" }),
        new Paragraph({}),
      ],
    });
  }

  const els: any[] = [];
  elements.forEach((el) => {
    if (el.type === "text") {
      const p = el.properties as ITextProperties;
      els.push(
        new Paragraph({
          children: [
            new TextRun({
              text: p.content,
              font: p.fontFamily,
              size: p.fontSize * 2,
              bold: p.bold,
              italics: p.italic,
              underline: p.underline ? { type: "single" } : undefined,
              color: p.color.replace("#", ""),
            }),
          ],
          alignment:
            p.align === "center"
              ? AlignmentType.CENTER
              : p.align === "right"
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT,
        })
      );
    } else if (el.type === "signature") {
      const p = el.properties as ISignatureProperties;
      els.push(
        new Paragraph({
          children: [
            new TextRun({
              text: p.text,
              size: p.fontSize * 2,
              color: p.color.replace("#", ""),
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );
      els.push(new Paragraph({}));
    } else if (el.type === "table") {
      const pr = el.properties as ITableProperties;
      const data =
        pr.data ||
        Array(pr.rows)
          .fill(null)
          .map(() => Array(pr.cols).fill(""));
      const rows: TableRow[] = [];
      for (let i = 0; i < pr.rows; i++) {
        const cells: TableCell[] = [];
        for (let j = 0; j < pr.cols; j++) {
          cells.push(
            new TableCell({
              children: [new Paragraph(data[i]?.[j] || "")],
              width: { size: 100 / pr.cols, type: WidthType.PERCENTAGE },
              borders: {
                top: {
                  style: "single",
                  size: pr.borderWidth * 8,
                  color: pr.borderColor.replace("#", ""),
                },
                bottom: {
                  style: "single",
                  size: pr.borderWidth * 8,
                  color: pr.borderColor.replace("#", ""),
                },
                left: {
                  style: "single",
                  size: pr.borderWidth * 8,
                  color: pr.borderColor.replace("#", ""),
                },
                right: {
                  style: "single",
                  size: pr.borderWidth * 8,
                  color: pr.borderColor.replace("#", ""),
                },
              },
            })
          );
        }
        rows.push(new TableRow({ children: cells }));
      }
      els.push(
        new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
      );
      els.push(new Paragraph({}));
    } else if (el.type === "divider") {
      const p = el.properties as IDividerProperties;
      els.push(
        new Paragraph({
          text: "",
          border: {
            top: {
              style:
                p.style === "dashed"
                  ? "dashed"
                  : p.style === "dotted"
                  ? "dotted"
                  : "single",
              size: p.thickness * 8,
              color: p.color.replace("#", ""),
            },
          },
        })
      );
    } else if (el.type === "image") {
      els.push(new Paragraph({ text: "[Изображение]", style: "ImageCaption" }));
    }
  });

  sections.push({ properties: {}, children: els });

  return Packer.toBlob(
    new Document({
      sections,
      styles: {
        paragraphStyles: [
          {
            id: "Subtitle",
            name: "Subtitle",
            basedOn: "Normal",
            next: "Normal",
            run: { size: 22, color: "666666" },
          },
          {
            id: "ImageCaption",
            name: "Image Caption",
            basedOn: "Normal",
            next: "Normal",
            run: { size: 20, italics: true, color: "999999" },
          },
        ],
      },
    })
  );
}
