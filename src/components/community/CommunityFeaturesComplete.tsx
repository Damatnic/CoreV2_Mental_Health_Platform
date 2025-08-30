import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Hash,
  Lock,
  Unlock,
  Send,
  Heart,
  MessageCircle,
  Share2,
  Flag,
  Shield,
  Eye,
  EyeOff,
  Smile,
  Paperclip,
  Image,
  Mic,
  Video,
  Phone,
  Search,
  Filter,
  TrendingUp,
  Award,
  Star,
  UserPlus,
  UserCheck,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Circle,
  CheckCircle,
  AlertCircle,
  Globe,
  Zap,
  Coffee,
  Moon,
  Sun,
  Cloud,
  Activity,
  Sparkles,
  BookOpen,
  HelpCircle
} from 'lucide-react';

// Types for community features
interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  isAnonymous?: boolean;
  badges?: Badge[];
  joinedAt: Date;
  bio?: string;
  supportRole?: 'peer' | 'moderator' | 'professional';
}

interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  edited?: boolean;
  reactions?: Reaction[];
  replyTo?: string;
  attachments?: Attachment[];
  isAnonymous?: boolean;
}

interface Reaction {
  emoji: string;
  users: string[];
}

interface Attachment {
  type: 'image' | 'file' | 'voice';
  url: string;
  name: string;
  size?: number;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'support' | 'crisis';
  members: number;
  lastActivity: Date;
  unreadCount?: number;
  icon?: React.ReactNode;
  rules?: string[];
  moderators?: string[];
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: User;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
  views: number;
  replies: number;
  likes: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isAnonymous?: boolean;
}

interface ForumReply {
  id: string;
  postId: string;
  content: string;
  author: User;
  createdAt: Date;
  likes: number;
  isAccepted?: boolean;
  isModerator?: boolean;
}

interface SupportGroup {
  id: string;
  name: string;
  description: string;
  category: 'anxiety' | 'depression' | 'ptsd' | 'addiction' | 'grief' | 'relationships' | 'general';
  members: User[];
  schedule?: GroupSchedule;
  isActive: boolean;
  maxMembers: number;
  guidelines: string[];
  facilitator?: User;
}

interface GroupSchedule {
  day: string;
  time: string;
  duration: number;
  timezone: string;
}

// Real-time Chat Component
const RealTimeChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock channels
  const channels: Channel[] = [
    {
      id: 'general',
      name: 'General Support',
      description: 'Open discussion for all members',
      type: 'public',
      members: 234,
      lastActivity: new Date(),
      icon: <Globe className="w-4 h-4" />
    },
    {
      id: 'anxiety',
      name: 'Anxiety Support',
      description: 'Support for anxiety and panic',
      type: 'support',
      members: 156,
      lastActivity: new Date(),
      icon: <Activity className="w-4 h-4" />
    },
    {
      id: 'depression',
      name: 'Depression Support',
      description: 'Understanding and managing depression',
      type: 'support',
      members: 189,
      lastActivity: new Date(),
      icon: <Cloud className="w-4 h-4" />
    },
    {
      id: 'crisis',
      name: 'Crisis Support',
      description: 'Immediate support - Moderated 24/7',
      type: 'crisis',
      members: 45,
      lastActivity: new Date(),
      icon: <AlertCircle className="w-4 h-4" />
    }
  ];

  // Mock messages
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        userId: 'user1',
        username: 'SupportSeeker',
        content: 'Hey everyone, having a tough day today. Anyone around to chat?',
        timestamp: new Date(Date.now() - 3600000),
        reactions: [{ emoji: '❤️', users: ['user2', 'user3'] }]
      },
      {
        id: '2',
        userId: 'user2',
        username: 'Anonymous',
        content: "I'm here! What's on your mind?",
        timestamp: new Date(Date.now() - 3000000),
        isAnonymous: true
      },
      {
        id: '3',
        userId: 'user3',
        username: 'PeerSupporter',
        content: 'Remember, tough days are temporary. We're all here for you. 💪',
        timestamp: new Date(Date.now() - 2400000),
        reactions: [{ emoji: '👍', users: ['user1'] }]
      }
    ];
    setMessages(mockMessages);
    setSelectedChannel(channels[0]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      userId: 'currentUser',
      username: isAnonymous ? 'Anonymous' : 'You',
      content: newMessage,
      timestamp: new Date(),
      isAnonymous
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsTyping(false);
  };

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (existingReaction.users.includes('currentUser')) {
            existingReaction.users = existingReaction.users.filter(u => u !== 'currentUser');
          } else {
            existingReaction.users.push('currentUser');
          }
        } else {
          reactions.push({ emoji, users: ['currentUser'] });
        }
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const emojis = ['❤️', '👍', '🤗', '💪', '🌟', '🙏'];

  return (
    <div className="real-time-chat flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Channels Sidebar */}
      <div className="w-64 bg-gray-50 border-r">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Channels</h3>
          <div className="space-y-1">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full px-3 py-2 rounded-lg text-left transition-colors flex items-center gap-2 ${
                  selectedChannel?.id === channel.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className={`p-1 rounded ${
                  channel.type === 'crisis' ? 'bg-red-100 text-red-600' :
                  channel.type === 'support' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {channel.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{channel.name}</div>
                  <div className="text-xs text-gray-500">{channel.members} members</div>
                </div>
                {channel.unreadCount && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous Mode Toggle */}
        <div className="p-4 border-t">
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isAnonymous
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isAnonymous ? 'Anonymous Mode' : 'Show Identity'}
            </span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        {selectedChannel && (
          <div className="px-6 py-4 border-b bg-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">#{selectedChannel.name}</h2>
                <p className="text-sm text-gray-600">{selectedChannel.description}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Users className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.userId === 'currentUser' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                message.isAnonymous ? 'bg-purple-100' : 'bg-indigo-100'
              }`}>
                {message.isAnonymous ? (
                  <EyeOff className="w-5 h-5 text-purple-600" />
                ) : (
                  <span className="text-sm font-semibold text-indigo-600">
                    {message.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className={`flex-1 max-w-md ${message.userId === 'currentUser' ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {message.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`inline-block px-4 py-2 rounded-lg ${
                  message.userId === 'currentUser'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.content}
                </div>
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {message.reactions.map((reaction, idx) => (
                      <button
                        key={idx}
                        onClick={() => addReaction(message.id, reaction.emoji)}
                        className="px-2 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                        {reaction.emoji} {reaction.users.length}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 mt-1">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(message.id, emoji)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
              <span>{typingUsers.join(', ')} is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex gap-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isAnonymous ? "Message as Anonymous..." : "Type a message..."}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Support Forums Component
const SupportForums: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Mock forum posts
  useEffect(() => {
    const mockPosts: ForumPost[] = [
      {
        id: '1',
        title: 'How do you cope with morning anxiety?',
        content: 'I've been struggling with intense anxiety every morning...',
        author: {
          id: 'user1',
          username: 'AnxiousWarrior',
          displayName: 'Anxious Warrior',
          status: 'online',
          joinedAt: new Date('2023-01-01')
        },
        category: 'anxiety',
        tags: ['morning-anxiety', 'coping-strategies', 'tips'],
        createdAt: new Date(Date.now() - 7200000),
        views: 234,
        replies: 15,
        likes: 45,
        isPinned: true
      },
      {
        id: '2',
        title: 'Success story: 6 months depression-free',
        content: 'I wanted to share my journey and what worked for me...',
        author: {
          id: 'user2',
          username: 'HopefulSoul',
          displayName: 'Hopeful Soul',
          status: 'online',
          joinedAt: new Date('2022-06-15'),
          badges: [
            {
              id: 'contributor',
              name: 'Top Contributor',
              icon: <Award className="w-4 h-4" />,
              color: 'text-yellow-600',
              description: 'Active community member'
            }
          ]
        },
        category: 'success-stories',
        tags: ['depression', 'recovery', 'inspiration'],
        createdAt: new Date(Date.now() - 86400000),
        views: 567,
        replies: 32,
        likes: 128
      },
      {
        id: '3',
        title: 'Anonymous: Dealing with family who don\'t understand',
        content: 'My family thinks I\'m just being dramatic...',
        author: {
          id: 'user3',
          username: 'Anonymous',
          displayName: 'Anonymous',
          status: 'online',
          isAnonymous: true,
          joinedAt: new Date()
        },
        category: 'relationships',
        tags: ['family', 'understanding', 'support'],
        createdAt: new Date(Date.now() - 3600000),
        views: 89,
        replies: 7,
        likes: 23,
        isAnonymous: true
      }
    ];
    setPosts(mockPosts);
  }, []);

  const categories = [
    { id: 'all', name: 'All Topics', icon: <Globe className="w-4 h-4" /> },
    { id: 'anxiety', name: 'Anxiety', icon: <Activity className="w-4 h-4" /> },
    { id: 'depression', name: 'Depression', icon: <Cloud className="w-4 h-4" /> },
    { id: 'relationships', name: 'Relationships', icon: <Heart className="w-4 h-4" /> },
    { id: 'success-stories', name: 'Success Stories', icon: <Star className="w-4 h-4" /> },
    { id: 'resources', name: 'Resources', icon: <BookOpen className="w-4 h-4" /> }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'popular':
        return b.likes - a.likes;
      case 'unanswered':
        return a.replies - b.replies;
      default:
        return 0;
    }
  });

  return (
    <div className="support-forums">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Forums</h2>
          <p className="text-gray-600">Connect, share, and learn from our community</p>
        </div>
        <button
          onClick={() => setShowCreatePost(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search forums..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mt-4 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {sortedPosts.map(post => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {post.isPinned && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                      Pinned
                    </span>
                  )}
                  {post.isAnonymous && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      Anonymous
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-gray-600 line-clamp-2">{post.content}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  {post.isAnonymous ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-indigo-600">
                        {post.author.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span>{post.author.displayName}</span>
                </div>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.views}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {post.replies}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {post.likes}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Anonymous Sharing Component
const AnonymousSharing: React.FC = () => {
  const [shareContent, setShareContent] = useState('');
  const [shareCategory, setShareCategory] = useState('general');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedStories, setSharedStories] = useState<any[]>([]);

  const shareCategories = [
    { id: 'general', name: 'General', color: 'bg-gray-100 text-gray-700' },
    { id: 'struggle', name: 'Current Struggle', color: 'bg-red-100 text-red-700' },
    { id: 'victory', name: 'Small Victory', color: 'bg-green-100 text-green-700' },
    { id: 'gratitude', name: 'Gratitude', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'advice', name: 'Seeking Advice', color: 'bg-blue-100 text-blue-700' }
  ];

  // Mock shared stories
  useEffect(() => {
    const mockStories = [
      {
        id: '1',
        content: 'Today I managed to get out of bed and take a shower. It might not seem like much, but for me, it\'s a huge victory.',
        category: 'victory',
        timestamp: new Date(Date.now() - 3600000),
        reactions: { hearts: 45, hugs: 23, strength: 18 }
      },
      {
        id: '2',
        content: 'I\'m struggling with intrusive thoughts again. Some days are harder than others, but I\'m trying to remember that thoughts are not facts.',
        category: 'struggle',
        timestamp: new Date(Date.now() - 7200000),
        reactions: { hearts: 67, hugs: 34, strength: 29 }
      },
      {
        id: '3',
        content: 'Grateful for this community. Knowing I\'m not alone in this journey makes such a difference.',
        category: 'gratitude',
        timestamp: new Date(Date.now() - 10800000),
        reactions: { hearts: 89, hugs: 12, strength: 5 }
      }
    ];
    setSharedStories(mockStories);
  }, []);

  const handleShare = () => {
    if (!shareContent.trim()) return;

    setIsSharing(true);
    setTimeout(() => {
      const newStory = {
        id: Date.now().toString(),
        content: shareContent,
        category: shareCategory,
        timestamp: new Date(),
        reactions: { hearts: 0, hugs: 0, strength: 0 }
      };
      setSharedStories(prev => [newStory, ...prev]);
      setShareContent('');
      setIsSharing(false);
    }, 1000);
  };

  const addReaction = (storyId: string, reaction: 'hearts' | 'hugs' | 'strength') => {
    setSharedStories(prev => prev.map(story => {
      if (story.id === storyId) {
        return {
          ...story,
          reactions: {
            ...story.reactions,
            [reaction]: story.reactions[reaction] + 1
          }
        };
      }
      return story;
    }));
  };

  return (
    <div className="anonymous-sharing">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Anonymous Sharing Space</h2>
        <p className="text-gray-600">Share your thoughts and feelings in a safe, judgment-free space</p>
      </div>

      {/* Share Box */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <EyeOff className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-gray-900">Share Anonymously</span>
        </div>
        
        <textarea
          value={shareContent}
          onChange={(e) => setShareContent(e.target.value)}
          placeholder="What's on your mind? Your identity is completely protected..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={4}
        />

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            {shareCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setShareCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  shareCategory === cat.id
                    ? cat.color
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleShare}
            disabled={isSharing || !shareContent.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSharing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                Share
              </>
            )}
          </button>
        </div>
      </div>

      {/* Shared Stories */}
      <div className="space-y-4">
        {sharedStories.map(story => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <span className="font-medium text-gray-900">Anonymous</span>
                <span className="text-sm text-gray-500 ml-2">
                  {new Date(story.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ml-auto ${
                shareCategories.find(c => c.id === story.category)?.color
              }`}>
                {shareCategories.find(c => c.id === story.category)?.name}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{story.content}</p>

            <div className="flex gap-3">
              <button
                onClick={() => addReaction(story.id, 'hearts')}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                ❤️ {story.reactions.hearts}
              </button>
              <button
                onClick={() => addReaction(story.id, 'hugs')}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                🤗 {story.reactions.hugs}
              </button>
              <button
                onClick={() => addReaction(story.id, 'strength')}
                className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
              >
                💪 {story.reactions.strength}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Moderation Dashboard Component
const ModerationDashboard: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [moderationQueue, setModerationQueue] = useState<any[]>([]);

  useEffect(() => {
    // Mock moderation data
    const mockReports = [
      {
        id: '1',
        type: 'inappropriate',
        content: 'Reported message content...',
        reporter: 'User123',
        timestamp: new Date(Date.now() - 3600000),
        status: 'pending'
      },
      {
        id: '2',
        type: 'spam',
        content: 'Potential spam content...',
        reporter: 'User456',
        timestamp: new Date(Date.now() - 7200000),
        status: 'reviewing'
      }
    ];
    setReports(mockReports);
  }, []);

  return (
    <div className="moderation-dashboard bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-indigo-600" />
        <h3 className="text-xl font-bold text-gray-900">Moderation Tools</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Pending Reports</span>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">12</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active Moderators</span>
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">5</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Resolved Today</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">28</div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Recent Reports</h4>
        {reports.map(report => (
          <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  report.type === 'inappropriate' ? 'bg-red-100 text-red-700' :
                  report.type === 'spam' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {report.type}
                </span>
                <p className="text-sm text-gray-600 mt-2">{report.content}</p>
                <div className="text-xs text-gray-500 mt-1">
                  Reported by {report.reporter} • {new Date(report.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                  Approve
                </button>
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Community Features Component
const CommunityFeaturesComplete: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'forums' | 'anonymous' | 'groups' | 'moderation'>('chat');

  const tabs = [
    { id: 'chat', name: 'Live Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'forums', name: 'Forums', icon: <Users className="w-5 h-5" /> },
    { id: 'anonymous', name: 'Anonymous', icon: <EyeOff className="w-5 h-5" /> },
    { id: 'groups', name: 'Support Groups', icon: <Heart className="w-5 h-5" /> },
    { id: 'moderation', name: 'Moderation', icon: <Shield className="w-5 h-5" /> }
  ];

  return (
    <div className="community-features-complete max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Hub</h1>
        <p className="text-gray-600">Connect with peers, share experiences, and find support</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            <span className="font-medium">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'chat' && <RealTimeChat />}
          {activeTab === 'forums' && <SupportForums />}
          {activeTab === 'anonymous' && <AnonymousSharing />}
          {activeTab === 'groups' && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Support Groups</h3>
              <p className="text-gray-600">Join moderated support groups for your specific needs</p>
            </div>
          )}
          {activeTab === 'moderation' && <ModerationDashboard />}
        </motion.div>
      </AnimatePresence>

      {/* Community Guidelines */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Community Guidelines</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>Be respectful and supportive of all community members</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>Maintain confidentiality - what's shared here, stays here</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>No medical advice - encourage professional help when needed</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>Report concerning content to moderators immediately</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CommunityFeaturesComplete;