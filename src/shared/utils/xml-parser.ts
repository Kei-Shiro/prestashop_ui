// utils/xml-parser.ts
export function parseXml(xmlString: string): Document {
    return new DOMParser().parseFromString(xmlString, 'application/xml')
}

// Convertit XML en objet JS simple
export function xmlToJson(xml: Document | Element): unknown {
    const result: Record<string, unknown> = {}

    xml.childNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return
        const el = node as Element
        const children = el.children

        const value = children.length > 0 
            ? xmlToJson(el)       // nœud parent → récursif
            : el.textContent      // nœud feuille → valeur texte

        if (result[el.tagName] !== undefined) {
            if (Array.isArray(result[el.tagName])) {
                (result[el.tagName] as unknown[]).push(value)
            } else {
                result[el.tagName] = [result[el.tagName], value]
            }
        } else {
            result[el.tagName] = value
        }
    })

    return result
}