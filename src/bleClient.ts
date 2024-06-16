import noble from '@abandonware/noble';

interface MessageBase {
    type: string
    sourceAddress: string
    destinationAddress: string

    [key: string]: any
}

let autoincrement = 0;

const reqRegKey: MessageBase = {
    destinationAddress: "", sourceAddress: "",
    type: 'reqRegKey', key: ""
};

const SERVICE_UUID = 'abcd';
const PUBLIC_CHAR_UUID = '1234';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 500;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const cmpUUD = (a: string, b: string) => a.replace(/[^a-zA-Z0-9 ]/g, "") === b.replace(/[^a-zA-Z0-9 ]/g, "");

async function main() {
    noble.on('stateChange', async (state) => {
        console.log(`State changed to: ${state}`);
        if (state === 'poweredOn') {
            console.log('Starting scanning...');
            try {
                await noble.startScanningAsync();
                console.log('Scanning started successfully');
            } catch (error) {
                console.error('Error starting scanning:', error);
            }
        } else {
            noble.stopScanning();
            console.log('Stopped scanning due to state change');
        }
    });

    noble.on('discover', async (peripheral) => {
        console.log('Discovered peripheral:', peripheral.advertisement.localName);
        console.log('Advertisement:', peripheral.advertisement);

        if (peripheral.advertisement.localName === 'BleLock') {
            console.log('Found BleLock');
            noble.stopScanning();

            try {
                await connectAndInteract(peripheral);
            } catch (error) {
                console.error('Error interacting with BleLock:', error);
                await reconnect(peripheral);
            }
        }
    });
}

async function connectAndInteract(peripheral: noble.Peripheral) {
    try {
        await peripheral.connectAsync();
        console.log('Connected to BleLock');

        const services = await discoverServices(peripheral, [SERVICE_UUID]);
        const characteristics = await discoverCharacteristics(services[0], [PUBLIC_CHAR_UUID]);

        const publicCharacteristic = characteristics.find(char => cmpUUD(char.uuid, PUBLIC_CHAR_UUID));

        if (publicCharacteristic) {
            const data = await publicCharacteristic.readAsync();
            const uniqueUUID = data.toString('utf-8');
            console.log('Received unique UUID:', uniqueUUID);

            await interactWithUniqueCharacteristic(peripheral, uniqueUUID);
        } else {
            throw new Error('Public characteristic not found');
        }
    } catch (error) {
        console.error('Error in connectAndInteract:', error);
        throw error;
    }
}

async function interactWithUniqueCharacteristic(peripheral: noble.Peripheral, uniqueUUID: string) {
    try {
        let uniqueCharacteristic;

        do {
            console.time('dConn');
            await peripheral.disconnectAsync();
            console.timeEnd('dConn');
            console.log('Disconnected from BleLock to refresh services and characteristics');
            await wait(100);  // Adding a delay to stabilize before reconnecting

            console.time('Conn');
            await peripheral.connectAsync();
            console.timeEnd('Conn');
            console.log('Reconnected to BleLock');

            console.time('characteristics');

            const {services, characteristics} =
                await peripheral.discoverSomeServicesAndCharacteristicsAsync([SERVICE_UUID], []);

            console.timeEnd('characteristics');

            uniqueCharacteristic = characteristics.find(char => cmpUUD(char.uuid, uniqueUUID));
            if (!uniqueCharacteristic) await wait(100);
        }
        while (!uniqueCharacteristic);

        if (uniqueCharacteristic) {
            await uniqueCharacteristic.subscribeAsync();
            console.log('Subscribed to notifications from unique characteristic');

            uniqueCharacteristic.on('data', (data, isNotification) => {
                console.log('Notification received from unique characteristic:', data.toString('utf-8'));
            });

            while (true) {
                reqRegKey.key = uniqueUUID;
                reqRegKey.sourceAddress = String(autoincrement);
                const message = JSON.stringify(reqRegKey);
                console.log('try to send next message')
                await uniqueCharacteristic.writeAsync(Buffer.from(message), false);
                console.log('Message sent to unique characteristic', autoincrement++);
                await wait(5000);  // Add a delay to avoid flooding the characteristic
            }
        } else {
            throw new Error('Unique characteristic not found');
        }
    } catch (error) {
        console.error('Error in interactWithUniqueCharacteristic:', error);
        throw error;
    }
}

async function reconnect(peripheral: noble.Peripheral) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            console.log(`Reconnecting... Attempt ${retries + 1}`);
            await connectAndInteract(peripheral);
            console.log('Reconnection successful');
            return;
        } catch (error) {
            console.error(`Reconnection attempt ${retries + 1} failed`, error);
            retries++;
            await wait(RETRY_DELAY_MS);
        }
    }
    console.error('Max reconnection attempts reached. Giving up.');
}

async function discoverServices(peripheral: noble.Peripheral, serviceUUIDs: string[]): Promise<noble.Service[]> {
    return new Promise((resolve, reject) => {
        peripheral.discoverServices(serviceUUIDs, (error, services) => {
            if (error) {
                reject(error);
            } else {
                console.log('Discovered services:', services.map(service => service.uuid));
                resolve(services);
            }
        });
    });
}

async function discoverCharacteristics(service: noble.Service, characteristicUUIDs: string[]): Promise<noble.Characteristic[]> {
    return new Promise((resolve, reject) => {
        service.discoverCharacteristics(characteristicUUIDs, (error, characteristics) => {
            if (error) {
                reject(error);
            } else {
                console.log('Discovered characteristics:', characteristics.map(char => char.uuid));
                resolve(characteristics);
            }
        });
    });
}

main().catch(console.error);
