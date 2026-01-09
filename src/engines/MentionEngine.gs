/**
 * MentionEngine - User Mention System
 * Handles parsing, validation, and formatting of user mentions in comments
 * 
 * Features:
 * - Parse @username patterns from text
 * - Validate mentioned users exist and are active
 * - Format mentions with highlighting
 * - Search user directory for autocomplete
 */

class MentionEngine {
  
  /**
   * Parse comment text for @mentions
   * @param {string} commentText - The comment text to parse
   * @returns {Object} Parsed mention data
   */
  static parseCommentForMentions(commentText) {
    if (!commentText || typeof commentText !== 'string') {
      return {
        originalText: commentText || '',
        mentionedUsers: [],
        formattedText: commentText || '',
        isValid: true
      };
    }
    
    // Pattern to match @email addresses (more permissive for various email formats)
    const mentionPattern = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const mentionedUsers = [];
    const invalidMentions = [];
    let formattedText = commentText;
    let match;
    
    // Extract all mentions
    while ((match = mentionPattern.exec(commentText)) !== null) {
      const fullMatch = match[0]; // @email@domain.com
      const emailAddress = match[1]; // email@domain.com
      
      // Avoid duplicates
      if (!mentionedUsers.find(m => m.email === emailAddress)) {
        // Validate user exists and is active
        const user = getUserByEmail(emailAddress);
        
        if (user && user.active) {
          mentionedUsers.push({
            email: emailAddress,
            name: user.name,
            fullMatch: fullMatch,
            isValid: true
          });
        } else {
          invalidMentions.push({
            email: emailAddress,
            fullMatch: fullMatch,
            reason: user ? 'User is inactive' : 'User not found'
          });
        }
      }
    }
    
    // Format text with mention highlighting (for valid mentions only)
    mentionedUsers.forEach(mention => {
      const highlightedMention = `<span class="mention" data-user="${mention.email}">@${mention.name}</span>`;
      formattedText = formattedText.replace(
        new RegExp(escapeRegExp(mention.fullMatch), 'g'),
        highlightedMention
      );
    });
    
    return {
      originalText: commentText,
      mentionedUsers: mentionedUsers,
      invalidMentions: invalidMentions,
      formattedText: formattedText,
      isValid: invalidMentions.length === 0
    };
  }
  
  /**
   * Get user suggestions for autocomplete
   * @param {string} query - Search query (partial email or name)
   * @param {Array} excludeUsers - User emails to exclude from results
   * @returns {Array} Array of user suggestions
   */
  static getUserSuggestions(query, excludeUsers = []) {
    if (!query || query.length < 1) {
      return [];
    }
    
    const activeUsers = getActiveUsers();
    const queryLower = query.toLowerCase();
    const excludeSet = new Set(excludeUsers.map(email => email.toLowerCase()));
    
    const suggestions = activeUsers
      .filter(user => {
        // Exclude specified users
        if (excludeSet.has(user.email.toLowerCase())) {
          return false;
        }
        
        // Match email or name
        const emailMatch = user.email.toLowerCase().includes(queryLower);
        const nameMatch = user.name.toLowerCase().includes(queryLower);
        
        return emailMatch || nameMatch;
      })
      .map(user => ({
        email: user.email,
        name: user.name,
        displayText: `${user.name} (${user.email})`,
        matchScore: this.calculateMatchScore(query, user)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Limit to 10 suggestions
    
    return suggestions;
  }
  
  /**
   * Calculate match score for sorting suggestions
   * @param {string} query - Search query
   * @param {Object} user - User object
   * @returns {number} Match score (higher is better)
   */
  static calculateMatchScore(query, user) {
    const queryLower = query.toLowerCase();
    const emailLower = user.email.toLowerCase();
    const nameLower = user.name.toLowerCase();
    
    let score = 0;
    
    // Exact matches get highest score
    if (emailLower === queryLower || nameLower === queryLower) {
      score += 100;
    }
    
    // Starts with query gets high score
    if (emailLower.startsWith(queryLower) || nameLower.startsWith(queryLower)) {
      score += 50;
    }
    
    // Contains query gets medium score
    if (emailLower.includes(queryLower)) {
      score += 20;
    }
    if (nameLower.includes(queryLower)) {
      score += 15;
    }
    
    // Prefer shorter matches (more specific)
    const avgLength = (user.email.length + user.name.length) / 2;
    score += Math.max(0, 50 - avgLength);
    
    return score;
  }
  
  /**
   * Validate mentioned users exist and are active
   * @param {Array} mentionedUsers - Array of user emails or user objects
   * @returns {Object} Validation results
   */
  static validateMentions(mentionedUsers) {
    if (!Array.isArray(mentionedUsers)) {
      return {
        isValid: false,
        validUsers: [],
        invalidUsers: [],
        errors: ['mentionedUsers must be an array']
      };
    }
    
    const validUsers = [];
    const invalidUsers = [];
    const errors = [];
    
    mentionedUsers.forEach(userRef => {
      const email = typeof userRef === 'string' ? userRef : userRef.email;
      
      if (!email || typeof email !== 'string') {
        invalidUsers.push({
          input: userRef,
          reason: 'Invalid email format'
        });
        return;
      }
      
      // Check if user exists and is active
      const user = getUserByEmail(email);
      
      if (!user) {
        invalidUsers.push({
          email: email,
          reason: 'User not found in directory'
        });
      } else if (!user.active) {
        invalidUsers.push({
          email: email,
          name: user.name,
          reason: 'User is inactive'
        });
      } else {
        validUsers.push({
          email: user.email,
          name: user.name,
          role: user.role
        });
      }
    });
    
    if (invalidUsers.length > 0) {
      errors.push(`${invalidUsers.length} invalid user(s) found`);
    }
    
    return {
      isValid: invalidUsers.length === 0,
      validUsers: validUsers,
      invalidUsers: invalidUsers,
      errors: errors
    };
  }
  
  /**
   * Create mention formatting and highlighting utilities
   * @param {string} text - Text containing mentions
   * @param {Array} mentionedUsers - Array of mentioned user objects
   * @returns {string} Formatted text with mention highlighting
   */
  static formatMentionsForDisplay(text, mentionedUsers = []) {
    if (!text || !Array.isArray(mentionedUsers) || mentionedUsers.length === 0) {
      return text || '';
    }
    
    let formattedText = text;
    
    mentionedUsers.forEach(user => {
      const email = typeof user === 'string' ? user : user.email;
      const name = typeof user === 'string' ? email : (user.name || email);
      
      // Replace @email with highlighted mention
      const mentionPattern = new RegExp(`@${escapeRegExp(email)}\\b`, 'g');
      const highlightedMention = `<span class="mention" data-user="${email}" title="${name}">@${name}</span>`;
      
      formattedText = formattedText.replace(mentionPattern, highlightedMention);
    });
    
    return formattedText;
  }
  
  /**
   * Extract plain text from formatted mentions (remove HTML)
   * @param {string} formattedText - Text with HTML mention formatting
   * @returns {string} Plain text with @mentions
   */
  static extractPlainTextMentions(formattedText) {
    if (!formattedText) return '';
    
    // Remove mention HTML tags but keep @username format
    return formattedText.replace(
      /<span class="mention"[^>]*>@([^<]+)<\/span>/g,
      '@$1'
    );
  }
  
  /**
   * Get mention statistics for a comment
   * @param {string} commentText - Comment text to analyze
   * @returns {Object} Mention statistics
   */
  static getMentionStatistics(commentText) {
    const parseResult = this.parseCommentForMentions(commentText);
    
    return {
      totalMentions: parseResult.mentionedUsers.length + parseResult.invalidMentions.length,
      validMentions: parseResult.mentionedUsers.length,
      invalidMentions: parseResult.invalidMentions.length,
      uniqueUsers: parseResult.mentionedUsers.length, // Already deduplicated in parsing
      hasInvalidMentions: parseResult.invalidMentions.length > 0,
      mentionedUserEmails: parseResult.mentionedUsers.map(u => u.email)
    };
  }
  
  /**
   * Create notification events for mentions
   * @param {string} taskId - Task ID where mention occurred
   * @param {Array} mentionedUsers - Array of mentioned user objects
   * @param {Object} comment - Comment object containing the mentions
   * @returns {Array} Array of created notification objects
   */
  static createMentionNotifications(taskId, mentionedUsers, comment) {
    if (!Array.isArray(mentionedUsers) || mentionedUsers.length === 0) {
      return [];
    }
    
    const notifications = [];
    const task = getTaskById(taskId);
    const taskTitle = task ? task.title : `Task ${taskId}`;
    const mentionedBy = comment.userId || getCurrentUserEmail();
    const mentionedByUser = getUserByEmail(mentionedBy);
    const mentionedByName = mentionedByUser ? mentionedByUser.name : mentionedBy;
    
    mentionedUsers.forEach(user => {
      const email = typeof user === 'string' ? user : user.email;
      
      // Don't notify users who mentioned themselves
      if (email === mentionedBy) {
        return;
      }
      
      try {
        // Create mention record
        const mention = createMention({
          commentId: comment.id,
          mentionedUserId: email,
          mentionedByUserId: mentionedBy,
          taskId: taskId
        });
        
        // Create notification
        const notification = createNotification({
          userId: email,
          type: 'mention',
          title: 'You were mentioned in a comment',
          message: `${mentionedByName} mentioned you in a comment on "${taskTitle}"`,
          entityType: 'task',
          entityId: taskId,
          channels: ['in_app', 'email']
        });
        
        notifications.push(notification);
        
      } catch (error) {
        console.error(`Failed to create mention notification for ${email}:`, error);
      }
    });
    
    return notifications;
  }
}

/**
 * Utility function to escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Enhanced comment creation function that integrates with MentionEngine
 * @param {string} taskId - Task ID
 * @param {string} content - Comment content
 * @param {string} userId - User creating the comment (optional)
 * @returns {Object} Created comment with mention processing
 */
function addCommentWithMentions(taskId, content, userId = null) {
  const currentUser = userId || getCurrentUserEmail();
  const timestamp = now();
  
  // Parse mentions using MentionEngine
  const mentionData = MentionEngine.parseCommentForMentions(content);
  
  // Validate all mentions
  const validation = MentionEngine.validateMentions(mentionData.mentionedUsers);
  
  if (!validation.isValid) {
    console.warn('Comment contains invalid mentions:', validation.errors);
    // Continue with valid mentions only
  }
  
  // Create comment with mention metadata
  const comment = {
    id: generateId('cmt'),
    taskId: taskId,
    userId: currentUser,
    content: sanitize(content),
    createdAt: timestamp,
    updatedAt: timestamp,
    mentionedUsers: validation.validUsers.map(u => u.email).join(','),
    isEdited: false,
    editHistory: JSON.stringify([])
  };
  
  // Save comment to sheet
  const sheet = getCommentsSheet();
  sheet.appendRow(objectToRow(comment, CONFIG.COMMENT_COLUMNS));
  
  // Create mention notifications
  const notifications = MentionEngine.createMentionNotifications(
    taskId, 
    validation.validUsers, 
    comment
  );
  
  // Log activity
  logActivity(currentUser, 'commented', 'task', taskId, {
    preview: content.substring(0, 50),
    mentions: validation.validUsers.length,
    notifications: notifications.length
  });
  
  // Return comment with processed mention data
  comment.mentionedUsers = validation.validUsers.map(u => u.email);
  comment.mentionData = mentionData;
  comment.notifications = notifications;
  
  return comment;
}

/**
 * Get formatted comment content for display
 * @param {Object} comment - Comment object
 * @returns {string} Formatted comment content with mention highlighting
 */
function getFormattedCommentContent(comment) {
  if (!comment || !comment.content) {
    return '';
  }
  
  // Get mentioned users from comment metadata
  const mentionedEmails = comment.mentionedUsers ? 
    (typeof comment.mentionedUsers === 'string' ? 
      comment.mentionedUsers.split(',').map(e => e.trim()) : 
      comment.mentionedUsers) : [];
  
  // Get user objects for formatting
  const mentionedUsers = mentionedEmails.map(email => {
    const user = getUserByEmail(email);
    return user ? { email: user.email, name: user.name } : { email: email, name: email };
  });
  
  return MentionEngine.formatMentionsForDisplay(comment.content, mentionedUsers);
}

console.log('✅ MentionEngine.gs loaded - User mention system ready');