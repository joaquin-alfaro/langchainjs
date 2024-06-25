import { Document } from "@langchain/core/documents";
import {
  BaseDocumentLoader
} from "@langchain/core/document_loaders/base";
import { htmlToText } from "html-to-text";

export interface MagnoliaContentsLoaderParams {
    collection: string;
    baseUrl: string;
    contentProperty: string;
    username?: string;
    password?: string;
}

export type MagnoliaContent = {
    "@name": string;
    "@path": string;
    "@id": string;
    "@nodeType": string;
} & Record<string, any>;

export interface MagnoliaDeliveryAPIResponse {
    total: number;
    results: Array<MagnoliaContent>;
}

export type DocumentMetadata = {
    "collection": string,
    "id": string,
    "path": string,
    "name": string,
    "nodeType": string,
    "url": string
}

export class MagnoliaContentsLoader
    extends BaseDocumentLoader
{
    public readonly collection: string;

    public readonly baseUrl: string;

    public readonly contentProperty: string;

    public readonly username?: string;
    
    public readonly password?: string;
  
    constructor({collection, baseUrl, contentProperty, username, password}: MagnoliaContentsLoaderParams) {
        super();
        this.collection = collection;
        this.baseUrl = baseUrl;
        this.contentProperty = contentProperty;
        this.username = username;
        this.password = password;    
    }

    /**
     * Returns the authorization header for the request.
     * @returns The authorization header as a string, or undefined if no credentials were provided.
     */
    private get authorizationHeader(): string | undefined {
        if (this.username && this.password) {
            const basicAuth = Buffer.from(
                `${this.username}:${this.password}`
            ).toString("base64");
            return `Authorization ${basicAuth}`;
        }

        return undefined;
    }

    public async load(): Promise<Document<DocumentMetadata>[]> {
        const contents = await this.fetchMagnoliaContents(this.baseUrl);
        // TODO fetchMagnoliaContents() should return `contents.result`
        const documents = contents.results.map(content => this.createDocumentFromContent(content));

        return documents;
    }

    protected async fetchMagnoliaContents(
        url: string
    ): Promise<MagnoliaDeliveryAPIResponse> {
        try {
            const initialHeaders: HeadersInit = {
              "Content-Type": "application/json",
              Accept: "application/json",
            };
      
            const authHeader = this.authorizationHeader;
            if (authHeader) {
              initialHeaders.Authorization = authHeader;
            }
      
            const response = await fetch(url, {
              headers: initialHeaders,
            });
      
            if (!response.ok) {
              throw new Error(
                `Failed to fetch ${url} from Magnolia: ${response.status}`
              );
            }
      
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to fetch "${url}" from Magnolia: ${error}`);
        }
    }

    private createDocumentFromContent(magnoliaContent: MagnoliaContent): Document<DocumentMetadata> {
        const content = magnoliaContent[this.contentProperty]
        // Convert HTML content to plain text
        const plainTextContent = htmlToText(content, {
            wordwrap: false,
            preserveNewlines: false,
        });
        return new Document({
            metadata: {
                "id": magnoliaContent["@id"],
                "path": magnoliaContent["@path"],
                "name": magnoliaContent["@name"],
                "nodeType": magnoliaContent["@nodeType"],
                "lastModifiedBy": magnoliaContent["mgnl:lastModifiedBy"],
                "lastModified": magnoliaContent["mgnl:lastModified"],
                "url": `${this.baseUrl}${magnoliaContent["@path"]}`,
                "collection": this.collection,
            },
            pageContent: plainTextContent
        });
    }
}