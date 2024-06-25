import { test, jest, expect } from "@jest/globals";
import { MagnoliaContentsLoader, MagnoliaDeliveryAPIResponse } from "../web/magnolia.js"

type TestMagnoliaContentsLoader = MagnoliaContentsLoader & {
    fetchMagnoliaContents: (url: string) => Promise<MagnoliaDeliveryAPIResponse>
}

test("Test loader fetches contents from Magnolia", async () => {
    const fakeContent = {
        "@name": "A-Taste-of-Malaysia",
        "@path": "/magnolia-travels/A-Taste-of-Malaysia",
        "@id": "a358f3ad-5a03-4f5d-b0ab-cb2219100472",
        "@nodeType": "mgnl:content",
        "name": "A Taste of Malaysia",
        "location": "Kuala Lumpur, Malaysia",
        "author": "Magnolia Travels",
        "body": "<p>Get to know amazing Malaysia in a unique way - by learning about and tasting its delicious food. Malaysia isn&rsquo;t just about beautiful beaches, stunning scenery and historic temples. Malaysian cooking has earned a place for itself among other great global cuisines. In this tour, we give you a taste of just what makes it special.</p>\n<p>We&#39;ll spend the first week sampling Kuala Lumpur&#39;s delicious cosmopolitan restaurants and sights. Along the way, we also have special cooking courses so you can re-make the magic once you get home. Then we&#39;ll venture south through the countryside - for the traditional cooking of the countryside before the finale in Singapore. We guarantee that the trip will leave you wanting to taste more.</p> ",
        "destination": [
            {
                "@name": "asia",
                "@path": "/destinations/asia",
                "@id": "7ec72c48-c33f-418e-b2ff-44cfb4bbb1f2",
                "@nodeType": "mgnl:category",
                "displayName": "Asia & the Pacific"
            }
        ]
    }

    const loader = new MagnoliaContentsLoader({
        collection: "tours",
        baseUrl: "http://your-magnolia-cms/.rest/delivery/tours/v1",
        contentProperty: "body",
    }) as TestMagnoliaContentsLoader

    const fetchMagnoliaContentsMock = jest.spyOn(loader, "fetchMagnoliaContents").mockImplementationOnce(
        () => Promise.resolve({
            "total": 36,
            "offset": 0,
            "limit": 50,
            "results": [fakeContent]
        })
    )

    const documents = await loader.load()

    console.log(documents)
    expect(fetchMagnoliaContentsMock).toHaveBeenCalledTimes(1)
    expect(documents.length).toBe(1)
    expect(documents[0].metadata.id).toBe("a358f3ad-5a03-4f5d-b0ab-cb2219100472")
    expect(documents[0].metadata.path).toBe("/magnolia-travels/A-Taste-of-Malaysia")
    expect(documents[0].metadata.url).toBe("http://your-magnolia-cms/.rest/delivery/tours/v1/magnolia-travels/A-Taste-of-Malaysia")
})