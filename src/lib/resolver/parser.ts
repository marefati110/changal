import { JSDOM } from 'jsdom';
import { junit } from 'node:test/reporters';
import * as cheerio from 'cheerio';

interface Link {
  href: string | undefined;
  text: string;
}

interface Link {
  href: string | undefined;
  text: string;
}

interface Image {
  src: string | undefined;
  alt: string | undefined;
}

interface MetaData {
  [key: string]: string | undefined;
}

interface FormField {
  type: string | string[] | undefined;
  value: string | undefined;
}

interface FormData {
  [key: string]: FormField;
}

type JsonLdData = unknown[]; // JSON-LD data is usually an array of objects

interface SeoData {
  title: string;
  description: string | undefined;
  keywords: string | undefined;
  canonical: string | undefined;
}

export class Parser {
  private $: cheerio.CheerioAPI;
  private document: Document;
  private html: string;

  constructor(html: string) {
    this.$ = cheerio.load(html); // Initialize cheerio with the HTML string
    const dom = new JSDOM(html);
    this.html = html;
    this.document = dom.window.document;
  }
  private isWordPressSite(): boolean {
    // Check for common WordPress markers
    // 1. Look for wp-content in asset URLs
    if (this.html.includes('/wp-content/')) {
      return true;
    }

    // 2. Look for the WordPress generator meta tag
    const generatorMeta = this.document.querySelector("meta[name='generator']");
    if (generatorMeta && generatorMeta.getAttribute('content')?.includes('WordPress')) {
      return true;
    }

    // 3. Check for WordPress-specific classes or IDs, e.g., wpadminbar
    if (this.document.getElementById('wpadminbar')) {
      return true;
    }

    // If none of the markers are found, return false
    return false;
  }

  private isNextJsSite(): boolean {
    // Check for common Next.js markers
    // 1. Look for _next/static in asset URLs
    if (this.html.includes('/_next/static/')) {
      return true;
    }

    // 2. Look for Next.js data attributes like data-next-page or data-next-route
    const nextDataAttributes = ['data-next-page', 'data-next-route'];
    for (const attr of nextDataAttributes) {
      if (this.document.querySelector(`[${attr}]`)) {
        return true;
      }
    }

    // 3. Check for Next.js-related class names (optional)
    // Note: This can be less reliable but might work in some cases
    const nextClassNames = Array.from(this.document.querySelectorAll('[class]')).some((el) =>
      el.className.includes('__next'),
    );
    if (nextClassNames) {
      return true;
    }

    // If none of the markers are found, return false
    return false;
  }

  private isNuxtJsSite(): boolean {
    // Check for common Nuxt.js markers
    // 1. Look for _nuxt in asset URLs
    if (this.html.includes('/_nuxt/')) {
      return true;
    }

    // 2. Look for Nuxt.js-specific data attributes like data-n-head
    const nuxtDataAttribute = this.document.querySelector('[data-n-head]');
    if (nuxtDataAttribute) {
      return true;
    }

    // 3. Check for Nuxt.js-related elements or attributes
    // Look for attributes like data-server-rendered
    if (this.document.querySelector("[data-server-rendered='true']")) {
      return true;
    }

    // If none of the markers are found, return false
    return false;
  }

  private extractTableData(): Array<Record<string, string>[]> {
    const tables = this.document.querySelectorAll('table');

    const allTablesData: Array<Record<string, string>[]> = [];

    tables.forEach((table) => {
      const rows = table.querySelectorAll('tr');
      const headers: string[] = [];
      const tableData: Record<string, string>[] = [];

      // Extract headers from the first row
      rows[0]?.querySelectorAll('th').forEach((headerCell) => {
        headers.push(headerCell.textContent?.trim() || '');
      });

      // Process each row after the header
      rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) return; // Skip header row

        const rowData: Record<string, string> = {};
        row.querySelectorAll('td').forEach((cell, cellIndex) => {
          const header = headers[cellIndex] || `Column ${cellIndex + 1}`;
          rowData[header] = cell.textContent?.trim() || '';
        });

        tableData.push(rowData);
      });

      allTablesData.push(tableData);
    });

    return allTablesData;
  }

  private detectTypeOfTarget() {
    const isWordpress = this.isWordPressSite();
    const isNextJs = this.isNextJsSite();
    const isNuxtJs = this.isNuxtJsSite();

    return {
      isNuxtJs,
      isNextJs,
      isWordpress,
    };
  }

  private extractLinks = (): Link[] => {
    const links: Link[] = [];
    this.$('a').each((i, link) => {
      const href = this.$(link).attr('href');
      const text = this.$(link).text();
      links.push({ href, text });
    });
    return links;
  };

  private extractImages(): Image[] {
    const images: Image[] = [];
    this.$('img').each((i, img) => {
      const src = this.$(img).attr('src');
      const alt = this.$(img).attr('alt');
      images.push({ src, alt });
    });
    return images;
  }

  private extractMetaData(): MetaData {
    const metaData: MetaData = {};
    this.$('meta').each((i, meta) => {
      const name = this.$(meta).attr('name') || this.$(meta).attr('property');
      const content = this.$(meta).attr('content');
      if (name) {
        metaData[name] = content;
      }
    });
    return metaData;
  }

  private extractTextContent(): string[] {
    const headings: string[] = [];
    this.$('h1, h2, h3, p').each((i, el) => {
      headings.push(this.$(el).text().trim());
    });
    return headings;
  }

  private extractFormData(): FormData[] {
    const formData: FormData[] = [];
    this.$('form').each((i, form) => {
      const formObj: FormData = {};
      this.$(form)
        .find('input, select, textarea')
        .each((j, field) => {
          const name = this.$(field).attr('name');
          const type = this.$(field).attr('type');
          const value = this.$(field).val();
          if (name) {
            formObj[name] = { type, value };
          }
        });
      formData.push(formObj);
    });
    return formData;
  }

  private extractJsonLdData(): JsonLdData {
    const jsonLdData: JsonLdData = [];
    this.$('script[type="application/ld+json"]').each((i, script) => {
      try {
        const data = JSON.parse(this.$(script).html() || '[]');
        jsonLdData.push(data);
      } catch (err) {
        console.error('Error parsing JSON-LD:', err);
      }
    });
    return jsonLdData;
  }

  private extractSeoData(): SeoData {
    return {
      title: this.$('title').text(),
      description: this.$('meta[name="description"]').attr('content'),
      keywords: this.$('meta[name="keywords"]').attr('content'),
      canonical: this.$('link[rel="canonical"]').attr('href'),
    };
  }

  private extractPaginationLinks(): string[] {
    const paginationLinks: string[] = [];
    this.$('a').each((i, link) => {
      const href = this.$(link).attr('href');
      if (href && href.includes('page')) {
        paginationLinks.push(href);
      }
    });
    return paginationLinks;
  }

  // private extractElementsById(): ElementWithId[] {
  //   const elementsWithId: ElementWithId[] = [];
  //   this.$('[id]').each((i, el) => {
  //     elementsWithId.push({ id: this.$(el).attr('id'), content: this.$(el).text() });
  //   });
  //   return elementsWithId;
  // }

  async parse() {
    const tables = this.extractTableData();
    const type = this.detectTypeOfTarget();
    const links = this.extractLinks();
    const images = this.extractImages();
    const metaData = this.extractMetaData();
    const content = this.extractTextContent();
    const formData = this.extractFormData();
    const json = this.extractJsonLdData();
    const seo = this.extractSeoData();
    const pagination = this.extractPaginationLinks();

    return {
      type,
      tables,
      links,
      images,
      metaData,
      content,
      formData,
      json,
      seo,
      pagination,
    };
  }
}
