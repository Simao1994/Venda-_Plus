import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.vendaplus.app',
    appName: 'Venda Plus',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
