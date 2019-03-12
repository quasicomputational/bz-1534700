const cleanup = async (session) => {
    const db = await dbPromise();
    try {
        while (true) {
            const tx = db.transaction([REFERENCE_STORE, NODE_STORE], "readwrite");
            const cursor = await tx.objectStore(REFERENCE_STORE).openCursor();
            if (typeof cursor === "undefined") {
                await tx.complete;
                break;
            }
            if (cursor.value.session === session) {
                await tx.complete;
                continue;
            }
            decref(tx, cursor.value.id);
            cursor.delete();
            await tx.complete;
        }
    } finally {
        db.close();
    }
};

const DB_NAME = "db";

const REFERENCE_STORE = "references";

const NODE_STORE = "nodes";

const CURRENT_STORE = "current";

const dbPromise = () => {
    return openDb(DB_NAME, 1, (db) => {
        switch (db.oldVersion) {
        case 0:
            db.createObjectStore(REFERENCE_STORE, { autoIncrement: true });

            const nodeStore = db.createObjectStore(NODE_STORE, { autoIncrement: true });
            nodeStore.add({ refcount: 1, value: "hi" })
                .then((id) => {
                    curStore.put(id, []);
                });

            const curStore = db.createObjectStore(CURRENT_STORE);
            curStore.put(0, []);
        }
    });
};

const incref = (tx, id) => {
    const nodeStore = tx.objectStore(NODE_STORE);
    const record = nodeStore.get(id);
    nodeStore.put({ ...record, refcount: record.refcount + 1 }, id);
};

const decref = (tx, id) => {
    const nodeStore = tx.objectStore(NODE_STORE);
    const record = nodeStore.get(id);
    if (record.id <= 0) {
        console.log("Double-free detected.");
    }
    nodeStore.put({ ...record, refcount: record.refcount - 1 }, id);
};
