import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema(
    {
        appName: {
            type: String,
            default: 'Papa Veg Pizza',
            trim: true
        },
        logo: {
            type: String,
            default: ''
        },
        favicon: {
            type: String,
            default: ''
        },
        primaryColor: {
            type: String,
            default: '#E53935'
        },
        secondaryColor: {
            type: String,
            default: '#FFC107'
        },
        accentColor: {
            type: String,
            default: '#4CAF50'
        },
        supportPhone: {
            type: String,
            default: ''
        },
        supportEmail: {
            type: String,
            default: ''
        }
    },
    {
        collection: 'food_app_settings',
        timestamps: true
    }
);

export const AppSettings = mongoose.model('AppSettings', appSettingsSchema);
