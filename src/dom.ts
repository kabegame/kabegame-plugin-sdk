import { selectAll } from "css-select";
import type { AnyNode, Element } from "domhandler";
import { isTag } from "domhandler";
import { getText } from "domutils";
import { parseDocument } from "htmlparser2";
import { currentHtml } from "./host";
import type { KbTextMatchElement } from "./types";

const isXPathLike = (selector: string) =>
  selector.startsWith("/") || selector.includes("[@") || selector.includes("::");

const parse = (html: string) =>
  parseDocument(html, {
    decodeEntities: true,
    lowerCaseAttributeNames: false,
    lowerCaseTags: false,
  });

const visitElements = (nodes: AnyNode[], fn: (element: Element) => void) => {
  for (const node of nodes) {
    if (isTag(node)) {
      fn(node);
    }
    const children = "children" in node ? node.children : undefined;
    if (children) {
      visitElements(children, fn);
    }
  }
};

const selectBySimpleXPath = (selector: string, html: string): Element[] => {
  const tag = selector.replace(/^\/+/, "").split("/")[0]?.trim();
  if (!tag) {
    return [];
  }
  const document = parse(html);
  const results: Element[] = [];
  visitElements(document.children, (element) => {
    if (element.name === tag) {
      results.push(element);
    }
  });
  return results;
};

const selectElements = (selector: string, html: string): Element[] => {
  if (isXPathLike(selector)) {
    return selectBySimpleXPath(selector, html);
  }
  const nodes = selectAll(selector, parse(html)) as unknown as AnyNode[];
  return nodes.filter((node): node is Element => isTag(node));
};

const resolveHtml = async (html?: string) => html ?? currentHtml();

export const query = async (selector: string, html?: string): Promise<string[]> => {
  const source = await resolveHtml(html);
  return selectElements(selector, source).map((element) => getText(element));
};

export const getAttr = async (
  selector: string,
  attr: string,
  html?: string,
): Promise<string[]> => {
  const source = await resolveHtml(html);
  return selectElements(selector, source)
    .map((element) => element.attribs[attr])
    .filter((value): value is string => typeof value === "string");
};

export const queryByText = async (
  text: string,
  html?: string,
): Promise<KbTextMatchElement[]> => {
  const source = await resolveHtml(html);
  const document = parse(source);
  const results: KbTextMatchElement[] = [];
  visitElements(document.children, (element) => {
    const elementText = getText(element);
    if (!elementText.includes(text)) {
      return;
    }
    const item: KbTextMatchElement = {
      text: elementText,
      tag: element.name,
      attrs: { ...element.attribs },
    };
    if (element.attribs.id) {
      item.id = element.attribs.id;
    }
    if (element.attribs.class) {
      item.class = element.attribs.class;
    }
    results.push(item);
  });
  return results;
};

export const findByText = async (
  text: string,
  tag: string,
  html?: string,
): Promise<string[]> => {
  const source = await resolveHtml(html);
  return selectElements(tag, source)
    .map((element) => getText(element))
    .filter((elementText) => elementText.includes(text));
};
