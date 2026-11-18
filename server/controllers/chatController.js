const dbAdapter = require('../services/dbAdapter');
const { generateAssistantResponse } = require('../ai/healthAssistantAI');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Send message to AI assistant
// @route   POST /api/chat/message
exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { conversationId, message, contextAllowed = true } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    let conversation;
    if (conversationId) {
      conversation = await dbAdapter.findById('ChatConversation', conversationId);
    }

    if (!conversation) {
      conversation = await dbAdapter.create('ChatConversation', {
        user: userId,
        title: message.slice(0, 32) + '...',
        contextAllowed: Boolean(contextAllowed)
      });
    }

    // Save User message
    const userMsgDoc = await dbAdapter.create('ChatMessage', {
      conversation: conversation._id || conversation.id,
      user: userId,
      role: 'user',
      content: message
    });

    // Fetch conversation message history
    const history = await dbAdapter.find('ChatMessage', { conversation: conversation._id || conversation.id }, { createdAt: 1 }, 12);

    // Fetch patient context if authorized
    let patientContext = null;
    if (conversation.contextAllowed) {
      const profile = await dbAdapter.findOne('PatientProfile', { user: userId });
      const recentReports = await dbAdapter.find('MedicalReport', { user: userId }, { createdAt: -1 }, 3);
      const activePrescriptions = await dbAdapter.find('PrescriptionMedicine', { user: userId }, { createdAt: -1 }, 5);
      const recentSymptoms = await dbAdapter.find('SymptomAnalysisResult', { user: userId }, { createdAt: -1 }, 2);
      const activeDiet = await dbAdapter.findOne('DietPlan', { user: userId, isActive: true });

      patientContext = {
        profile,
        recentReports,
        activePrescriptions,
        recentSymptoms,
        activeDiet
      };
    }

    // Call AI Health Assistant
    const aiResponse = await generateAssistantResponse({
      userMessage: message,
      conversationHistory: history,
      patientContext,
      contextAllowed: conversation.contextAllowed
    });

    // Save Assistant message
    const assistantMsgDoc = await dbAdapter.create('ChatMessage', {
      conversation: conversation._id || conversation.id,
      user: userId,
      role: 'assistant',
      content: aiResponse.reply,
      contextReferenced: aiResponse.contextReferenced,
      isEmergencyAlert: aiResponse.isEmergencyAlert,
      suggestedSpecialty: aiResponse.suggestedSpecialty
    });

    // Update conversation timestamp
    await dbAdapter.findByIdAndUpdate('ChatConversation', conversation._id || conversation.id, {
      lastMessageAt: new Date()
    });

    logAudit(req, 'CHAT_MESSAGE_SENT', 'ChatConversation', conversation._id || conversation.id, {
      isEmergencyAlert: aiResponse.isEmergencyAlert
    });

    res.status(200).json({
      success: true,
      conversationId: conversation._id || conversation.id,
      userMessage: userMsgDoc,
      assistantMessage: assistantMsgDoc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chat conversations
// @route   GET /api/chat/conversations
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const conversations = await dbAdapter.find('ChatConversation', { user: userId }, { lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id
exports.getConversationById = async (req, res, next) => {
  try {
    const conversation = await dbAdapter.findById('ChatConversation', req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const messages = await dbAdapter.find('ChatMessage', { conversation: req.params.id }, { createdAt: 1 }, 100);

    res.status(200).json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete conversation
// @route   DELETE /api/chat/conversations/:id
exports.deleteConversation = async (req, res, next) => {
  try {
    await dbAdapter.findByIdAndDelete('ChatConversation', req.params.id);
    res.status(200).json({ success: true, message: 'Conversation deleted.' });
  } catch (error) {
    next(error);
  }
};
