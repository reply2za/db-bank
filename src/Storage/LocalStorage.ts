import fs from 'fs';

class LocalStorage {
    FILE_NAME = 'localData.txt';

    getData() {
        return fs.readFileSync(this.FILE_NAME).toString();
    }

    async saveData(serializedData: string) {
        fs.writeFileSync(this.FILE_NAME, serializedData);
    }
}

const localStorage = new LocalStorage();
export { localStorage };
