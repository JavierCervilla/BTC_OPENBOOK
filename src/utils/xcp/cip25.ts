import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts";

function stripHtml(html: string | undefined | null): string {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc?.body?.textContent || "";
}

interface OwnerInfo {
    name?: string;
    title?: string;
    organization?: string;
}

interface Contact {
    type: string;
    data: string;
}

export interface Media {
    type: string;
    name?: string;
    data: string;
}

interface LegacyJsonInput {
    asset?: string;
    description?: string;
    image?: string;
    website?: string;
    pgpsig?: string;
    name?: string;
    owner?: OwnerInfo;
    contacts?: Contact[];
    categories?: Contact[];
    social?: Contact[];
    images?: Media[];
    audio?: string | Media[];
    video?: string | Media[];
    files?: Media[];
    dns?: Media[];
    html?: string;
    [key: string]: unknown;
}

export interface Cip25JsonOutput extends Omit<LegacyJsonInput, 'owner' | 'contacts' | 'categories' | 'social' | 'images' | 'audio' | 'video' | 'files' | 'dns'> {
    owner: OwnerInfo;
    contacts: Contact[];
    categories: Contact[];
    social: Contact[];
    images: Media[];
    audio: Media[];
    video: Media[];
    files: Media[];
    dns: Media[];
}

// Function to handle converting any JSON to use the CIP25 standard
// https://github.com/CounterpartyXCP/cips/blob/master/cip-0025.md
export function legacyJsonToCip25(o: LegacyJsonInput = {}): Cip25JsonOutput {
    const json: Cip25JsonOutput = {
        asset: typeof o.asset === 'string' ? o.asset : undefined,
        description: typeof o.description === 'string' ? o.description : undefined,
        image: typeof o.image === 'string' ? o.image : undefined,
        website: typeof o.website === 'string' ? o.website : undefined,
        pgpsig: typeof o.pgpsig === 'string' ? o.pgpsig : undefined,
        name: typeof o.name === 'string' ? o.name : undefined,
        owner: {},
        contacts: [],
        categories: [],
        social: [],
        images: [],
        audio: [],
        video: [],
        files: [],
        dns: []
    };

    // Owner fields
    if (o.owner && typeof o.owner === 'object') {
        for (const field of ['name', 'title', 'organization'] as const) {
            if (typeof o.owner[field] === 'string') {
                json.owner[field] = o.owner[field];
            }
        }
    }

    // Contacts Data
    if (typeof o.contact_address_line_1 === 'string') {
        const address = [
            o.contact_address_line_1,
            o.contact_address_line_2,
            o.contact_city,
            o.contact_state_province,
            o.contact_postal_code,
            o.contact_country
        ].filter(part => typeof part === 'string').join(' ');
        
        if (address) {
            json.contacts.push({
                type: 'address',
                data: address
            });
        }
    }
    for (const field of ['contact_email1', 'contact_email2', 'contact_phone', 'contact_fax']) {
        if (typeof o[field] === 'string') json.contacts.push({ type: field.replace('contact_', ''), data: o[field] as string });
    }
    for (const field of ['website_alternate1', 'website_alternate2']) {
        if (typeof o[field] === 'string') json.contacts.push({ type: 'url', data: o[field] as string });
    }

    // Category Data
    if (typeof o.category === 'string') json.categories.push({ type: 'main', data: o.category });
    if (typeof o.subcategory === 'string') json.categories.push({ type: 'sub', data: o.subcategory });
    if (typeof o.category_custom === 'string') json.categories.push({ type: 'other', data: o.category_custom });
    // Social Media
    for (const field of ['website_social_facebook', 'website_social_github', 'website_social_twitter', 'website_social_reddit', 'website_social_linkedin']) {
        if (typeof o[field] === 'string') json.social.push({ type: field.replace('website_social_', ''), data: o[field] as string });
    }

    // Images
    if (typeof o.image === 'string') {
        const image = o.image.match(/https?:\/\/[^\s]+/)?.[0]?.replace('"', '');
        if (image) json.images.push({ type: 'icon', data: image });
    }
    if (typeof o.image_large === 'string') {
        json.images.push({ 
            type: 'large', 
            name: typeof o.image_title === 'string' ? o.image_title : undefined, 
            data: o.image_large 
        });
    }
    if (typeof o.image_large_hd === 'string') {
        json.images.push({ 
            type: 'hires', 
            name: typeof o.image_title === 'string' ? o.image_title : undefined, 
            data: o.image_large_hd 
        });
    }
    if (Array.isArray(o.images)) {
        for (const image of o.images) {
            if (typeof image?.type === 'string' && typeof image?.data === 'string') {
                json.images.push({ 
                    type: image.type, 
                    name: typeof image.name === 'string' ? image.name : undefined, 
                    data: image.data 
                });
            }
        }
    }

    // Audio and Video
    for (const field of ['audio', 'video'] as const) {
        const value = o[field];
        if (typeof value === 'string' && value !== '') {
            json[field].push({ type: value.slice(-3), data: value });
        }
    }

    // Handle URLs from description for image, audio, and video content
    const urls = o.description?.match(/(((https?:\/\/)|(www\.))[^\s]+)/g) || [];
    for (const url of urls) {
        const cleanedUrl = url.replace('"', '');
        const ext = cleanedUrl.split('.').pop()?.toLowerCase();
        if (ext && ['gif', 'jpg', 'jpeg', 'png'].includes(ext) && !json.images.some((img) => img.data === cleanedUrl)) {
            json.images.push({ type: 'standard', data: cleanedUrl });
        } else if (ext && ['mp4', 'mov', 'wmv'].includes(ext) && !json.video.some((vid) => vid.data === cleanedUrl)) {
            json.video.push({ type: ext, data: cleanedUrl });
        } else if (ext && ['m4a', 'mp3', 'wav'].includes(ext) && !json.audio.some((aud) => aud.data === cleanedUrl)) {
            json.audio.push({ type: ext, data: cleanedUrl });
        }
    }

    if (typeof json.description === 'string') {
        const isHtml = ['<script', '<iframe', 'onload'].some((tag) => new RegExp(tag, 'ig').test(json.description as string));
        json.html = isHtml ? json.description : stripHtml(json.description);
    }

    return json;
}

export const fetchCIP25JSON = async (url: string): Promise<Cip25JsonOutput> => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const json = await response.json();
    return legacyJsonToCip25(json);
}