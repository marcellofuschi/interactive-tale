export default defineEventHandler(async (event) => {
    const requestValues = await useBody(event);

    let everypromptResponse: any = await $fetch(
        "https://www.everyprompt.com/api/v0/calls/marcello/interactive-tale-generator",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + process.env.EVERYPROMPT_KEY,
            },
            body: {
                variables: {
                    character_name: requestValues.character_name,
                    story: requestValues.story,
                },
                user: "testing",
            },
        }
    );

    let continuation = everypromptResponse.choices[0].text;

    // Make sure it doesnt end mid-sentence.
    let indexOfLastParagraphClosing = continuation.lastIndexOf('\n\n');
    if (indexOfLastParagraphClosing > 0) {
        continuation = continuation.slice(0, indexOfLastParagraphClosing);
    }

    return { continuation };
});
