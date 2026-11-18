const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { isConnected, memoryStorage } = require('../config/db');
// Ensure all Mongoose models and schemas are loaded & registered
const models = require('../models');

// Helper to check MongoDB connection state and model readiness
const getModel = (modelName) => {
  if (models && models[modelName]) return models[modelName];
  try {
    return mongoose.model(modelName);
  } catch (e) {
    return null;
  }
};

const hasLiveMongo = (modelName) => {
  const model = getModel(modelName);
  return mongoose.connection.readyState === 1 && isConnected() && Boolean(model);
};

const matchFilter = (item, filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(val)) {
      const orMatched = val.some(subFilter => matchFilter(item, subFilter));
      if (!orMatched) return false;
      continue;
    }
    const itemVal = item[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val.$regex) {
        const regex = new RegExp(val.$regex, val.$options || 'i');
        if (!regex.test(String(itemVal || ''))) return false;
      } else if (val.$in) {
        if (!val.$in.includes(itemVal)) return false;
      } else if (val.$gte !== undefined) {
        if (!(itemVal >= val.$gte)) return false;
      } else if (val.$lte !== undefined) {
        if (!(itemVal <= val.$lte)) return false;
      } else if (val.$ne !== undefined) {
        if (itemVal === val.$ne) return false;
      }
    } else {
      if (String(itemVal) !== String(val)) return false;
    }
  }
  return true;
};

const dbAdapter = {
  async find(modelName, filter = {}, sort = { createdAt: -1 }, limit = 100) {
    if (hasLiveMongo(modelName)) {
      const model = getModel(modelName);
      if (model) return await model.find(filter).sort(sort).limit(limit).lean();
    }
    const key = modelName.toLowerCase() + 's';
    const list = memoryStorage[key] || [];
    let results = list.filter(item => matchFilter(item, filter));
    
    // Sort
    const sortField = Object.keys(sort)[0] || 'createdAt';
    const sortDir = sort[sortField] === 1 ? 1 : -1;
    results.sort((a, b) => {
      if (a[sortField] < b[sortField]) return -1 * sortDir;
      if (a[sortField] > b[sortField]) return 1 * sortDir;
      return 0;
    });

    return results.slice(0, limit);
  },

  async findOne(modelName, filter = {}, select = '') {
    if (hasLiveMongo(modelName)) {
      const model = getModel(modelName);
      if (model) {
        let query = model.findOne(filter);
        if (select) query = query.select(select);
        return await query.lean();
      }
    }
    const key = modelName.toLowerCase() + 's';
    const list = memoryStorage[key] || [];
    return list.find(item => matchFilter(item, filter)) || null;
  },

  async findById(modelName, id, select = '') {
    if (hasLiveMongo(modelName)) {
      const model = getModel(modelName);
      if (model) {
        let query = model.findById(id);
        if (select) query = query.select(select);
        return await query.lean();
      }
    }
    const key = modelName.toLowerCase() + 's';
    const list = memoryStorage[key] || [];
    return list.find(item => String(item._id) === String(id) || String(item.id) === String(id)) || null;
  },

  async create(modelName, data) {
    if (hasLiveMongo(modelName)) {
      const model = getModel(modelName);
      if (model) {
        const doc = new model(data);
        return await doc.save();
      }
    }
    const key = modelName.toLowerCase() + 's';
    if (!memoryStorage[key]) memoryStorage[key] = [];
    
    const now = new Date();
    const newDoc = {
      ...data,
      _id: data._id || uuidv4(),
      id: data._id || uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    memoryStorage[key].unshift(newDoc);
    return newDoc;
  },

  async findByIdAndUpdate(modelName, id, updateData, options = { new: true }) {
    if (hasLiveMongo(modelName)) {
      const model = getModel(modelName);
      if (model) return await model.findByIdAndUpdate(id, updateData, options).lean();
    }
    const key = modelName.toLowerCase() + 's';
    const list = memoryStorage[key] || [];
    const index = list.findIndex(item => String(item._id) === String(id) || String(item.id) === String(id));
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updateData,
      updatedAt: new Date()
    };
    list[index] = updated;
    return updated;
  },

  async findByIdAndDelete(modelName, id) {
    if (hasLiveMongo(modelName)) {
      const model = getModel(modelName);
      if (model) return await model.findByIdAndDelete(id).lean();
    }
    const key = modelName.toLowerCase() + 's';
    const list = memoryStorage[key] || [];
    const index = list.findIndex(item => String(item._id) === String(id) || String(item.id) === String(id));
    if (index === -1) return null;
    const removed = list.splice(index, 1)[0];
    return removed;
  },

  async deleteMany(modelName, filter = {}) {
    if (hasLiveMongo(modelName)) {
      const model = getModel(modelName);
      if (model) return await model.deleteMany(filter);
    }
    const key = modelName.toLowerCase() + 's';
    const list = memoryStorage[key] || [];
    const remaining = list.filter(item => !matchFilter(item, filter));
    const deletedCount = list.length - remaining.length;
    memoryStorage[key] = remaining;
    return { deletedCount };
  },

  async countDocuments(modelName, filter = {}) {
    if (hasLiveMongo(modelName)) {
      const model = getModel(modelName);
      if (model) return await model.countDocuments(filter);
    }
    const key = modelName.toLowerCase() + 's';
    const list = memoryStorage[key] || [];
    return list.filter(item => matchFilter(item, filter)).length;
  }
};

module.exports = dbAdapter;
