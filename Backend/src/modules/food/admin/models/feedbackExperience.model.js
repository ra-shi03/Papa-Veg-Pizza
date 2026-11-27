import mongoose from 'mongoose';

const feedbackExperienceSchema = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true,
            refPath: 'userModel'
        },
        userModel: {
            type: String,
            required: true,
            // 'User' is the registered customer model name ('FoodUser' is only an import alias, so populate failed on
            // it); 'FoodUser' stays allowed for old records until they are rewritten
            enum: ['User', 'FoodUser', 'FoodStore', 'FoodDeliveryPartner'],
            default: 'User'
        },
        storeId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'FoodStore', 
            index: true 
        },
        rating: { 
            type: Number, 
            required: true,
            min: 1,
            max: 5
        },
        comment: { 
            type: String, 
            trim: true,
            default: ''
        },
        module: { 
            type: String, 
            enum: ['user', 'store', 'delivery'],
            required: true,
            index: true
        }
    },
    {
        collection: 'food_feedback_experiences',
        timestamps: true
    }
);

feedbackExperienceSchema.index({ module: 1, createdAt: -1 });
feedbackExperienceSchema.index({ userId: 1, createdAt: -1 });

export const FeedbackExperience = mongoose.model('FeedbackExperience', feedbackExperienceSchema);
