// The extension page holds a reference to the current node at the time that it asked. This gets stored in the database tagged with this session id so that, if we crash, the next time the extension starts up, the old references get cleared appropriately.

const acquire = async (session) => {
    const db = await dbPromise();
    try {
        const tx = db.transaction([CURRENT_STORE, NODE_STORE, REFERENCE_STORE], "readwrite");
        const id = await tx.objectStore(CURRENT_STORE).get([]);
        await incref(tx, id);
        const refId = await tx.objectStore(REFERENCE_STORE).add({ session, id });
        await tx.complete;
        return {
            id,
            release: async () => {
                const db = await dbPromise();
                try {
                    const tx = db.transaction([CURRENT_STORE, NODE_STORE, REFERENCE_STORE], "readwrite");
                    await tx.objectStore(REFERENCE_STORE).delete(id);
                    await decref(tx, id);
                    await tx.complete;
                } finally {
                    db.close();
                }
            },
        };
    } finally {
        db.close();
    }
};

const main = async (session) => {
    const { id, release } = await acquire(session);

    console.log(`Doing something with node ${id} - here's where the computer could lose power and create a dangling reference that needs to be cleaned up.`);

    setTimeout(() => {
        console.log("Stuff successfully done!");
        release();
    }, 10000);

};

browser.runtime.sendMessage({ messageName: "get-session" })
    .then(main);
