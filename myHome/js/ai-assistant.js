// DeepSeek AI 集成模块 - 智能路线分析、个性化建议、行程优化
class AIAssistant {
    constructor() {
        this.apiKey = CONFIG.API.DEEPSEEK.API_KEY;
        this.baseURL = CONFIG.API.DEEPSEEK.BASE_URL;
        this.model = CONFIG.API.DEEPSEEK.MODEL;
        this.maxTokens = CONFIG.API.DEEPSEEK.MAX_TOKENS;
        this.temperature = CONFIG.API.DEEPSEEK.TEMPERATURE;
        
        this.contextWindow = [];
        this.maxContextSize = CONFIG.AI.CONTEXT_WINDOW_SIZE;
        this.learningData = new Map(); // 个性化学习数据
        this.suggestionHistory = []; // 建议历史
        this.userPreferences = null;
        this.isInitialized = false;
        
        // AI功能模块
        this.modules = {
            routeAnalysis: null,
            weatherAdvice: null,
            accommodationRecommendation: null,
            riskAssessment: null,
            personalization: null
        };
        
        // 绑定方法
        this.init = this.init.bind(this);
        this.generateContext = this.generateContext.bind(this);
        this.callAI = this.callAI.bind(this);
    }

    // 初始化AI助手
    async init() {
        try {
            console.log('🤖 初始化DeepSeek AI助手...');
            
            // 验证API配置
            this.validateAPIConfig();
            
            // 初始化各个AI模块
            await this.initializeModules();
            
            // 加载用户偏好数据
            await this.loadUserPreferences();
            
            // 初始化上下文
            this.initializeContext();
            
            // 启动持续学习
            this.startContinuousLearning();
            
            this.isInitialized = true;
            console.log('✅ DeepSeek AI助手初始化完成');
            return true;
            
        } catch (error) {
            console.error('❌ DeepSeek AI助手初始化失败:', error);
            return false;
        }
    }

    // 验证API配置
    validateAPIConfig() {
        if (!this.apiKey) {
            throw new Error('DeepSeek API密钥未配置');
        }
        
        if (!this.baseURL) {
            throw new Error('DeepSeek API基础URL未配置');
        }
        
        console.log('✅ API配置验证通过');
    }

    // 初始化AI模块
    async initializeModules() {
        // 路线分析模块
        this.modules.routeAnalysis = {
            analyzeRoute: this.analyzeRoute.bind(this),
            optimizeRoute: this.optimizeRoute.bind(this),
            predictTraffic: this.predictTraffic.bind(this)
        };
        
        // 天气建议模块
        this.modules.weatherAdvice = {
            analyzeWeather: this.analyzeWeather.bind(this),
            provideAdvice: this.provideWeatherAdvice.bind(this),
            predictConditions: this.predictWeatherConditions.bind(this)
        };
        
        // 住宿推荐模块
        this.modules.accommodationRecommendation = {
            recommend: this.recommendAccommodation.bind(this),
            evaluate: this.evaluateAccommodation.bind(this),
            predictAvailability: this.predictAccommodationAvailability.bind(this)
        };
        
        // 风险评估模块
        this.modules.riskAssessment = {
            assessRoute: this.assessRouteRisk.bind(this),
            identifyHazards: this.identifyHazards.bind(this),
            calculateRisk: this.calculateRouteRisk.bind(this)
        };
        
        // 个性化模块
        this.modules.personalization = {
            learnPreferences: this.learnUserPreferences.bind(this),
            adaptRecommendations: this.adaptRecommendations.bind(this),
            predictNeeds: this.predictUserNeeds.bind(this)
        };
        
        console.log('✅ AI模块初始化完成');
    }

    // 加载用户偏好
    async loadUserPreferences() {
        try {
            if (window.dataManager && window.dataManager.userManager) {
                this.userPreferences = await window.dataManager.userManager.getPreferences();
            } else {
                this.userPreferences = CONFIG.USER_DEFAULTS;
            }
            
            console.log('✓ 用户偏好加载完成:', this.userPreferences);
            
        } catch (error) {
            console.warn('用户偏好加载失败，使用默认配置:', error);
            this.userPreferences = CONFIG.USER_DEFAULTS;
        }
    }

    // 初始化上下文
    initializeContext() {
        this.contextWindow = [{
            role: 'system',
            content: `你是一个专业的智能骑行助手，名叫"小智"，专门为骑行爱好者提供智能导航、路线规划、天气分析和个性化建议。

你的核心能力：
1. 智能路线规划和优化
2. 实时天气分析和预警
3. 骑行风险评估和安全建议
4. 个性化住宿和休息推荐
5. 体力管理和行程优化
6. 语音导航和实时指导

用户信息：
- 当前行程：宁波到九江，全程${CONFIG.ROUTE.TOTAL_DISTANCE}公里
- 骑行风格：${this.userPreferences.ridingStyle}
- 每日预算：${this.userPreferences.dailyBudget}元
- 偏好出发时间：${this.userPreferences.preferredStartTime}

请始终保持专业、友好、贴心的服务态度，提供准确、实用的建议。`
        }];
    }

    // 启动持续学习
    startContinuousLearning() {
        // 每天学习用户行为模式
        setInterval(() => {
            this.analyzeUserBehaviorPatterns();
        }, 24 * 60 * 60 * 1000); // 每天执行一次
    }

    // 分析路线
    async analyzeRoute(routeData) {
        try {
            console.log('🔍 AI分析路线数据...');
            
            const prompt = `
                请分析以下骑行路线数据，提供专业建议：
                
                路线信息：
                - 起点：${routeData.start?.name || '当前位置'}
                - 终点：${routeData.destination?.name || '目标地点'}
                - 总距离：${Math.round(routeData.totalDistance || 0)}公里
                - 预计时间：${Math.round((routeData.estimatedTime || 0) / 3600)}小时
                
                途经点：
                ${routeData.waypoints?.map((wp, i) => 
                    `${i + 1}. ${wp.name || '未命名'} - 距离${Math.round(wp.distance || 0)}km`
                ).join('\n') || '无'}
                
                当前天气：${routeData.weather?.condition || '未知'}
                用户体力：${routeData.fitness?.level || '未知'}
                
                请从以下角度分析：
                1. 路线难度和体力消耗评估
                2. 天气适应性分析
                3. 安全风险评估
                4. 休息点建议
                5. 个性化优化建议
                
                返回JSON格式：
                {
                    "difficulty": 1-10,
                    "riskLevel": "low|medium|high",
                    "weatherAdaptability": 1-10,
                    "suggestions": ["建议1", "建议2"],
                    "restPoints": [
                        {"location": "地点名", "recommendedTime": "HH:MM", "reason": "原因"}
                    ],
                    "warnings": ["警告1"],
                    "optimizations": ["优化建议1"]
                }
            `;
            
            const response = await this.callAI(prompt);
            const analysis = JSON.parse(response);
            
            console.log('✓ 路线分析完成');
            return analysis;
            
        } catch (error) {
            console.error('路线分析失败:', error);
            return this.getDefaultAnalysis();
        }
    }

    // 优化路线
    async optimizeRoute(originalRoute, constraints = {}) {
        try {
            console.log('⚡ AI优化路线...');
            
            const userConstraints = {
                maxDistance: constraints.maxDistance || this.userPreferences.ridingPreferences?.dailyDistance || 120,
                preferredTerrain: constraints.preferredTerrain || this.userPreferences.ridingPreferences?.preferredTerrain || 'mixed',
                budgetLimit: constraints.budgetLimit || this.userPreferences.dailyBudget || 100,
                timeLimit: constraints.timeLimit || 8, // 小时
                ...constraints
            };
            
            const prompt = `
                请优化以下骑行路线，考虑用户约束条件：
                
                原始路线：
                - 起点：${originalRoute.start?.name || '当前位置'}
                - 终点：${originalRoute.destination?.name || '目标地点'}
                - 当前距离：${Math.round(originalRoute.totalDistance || 0)}km
                
                用户约束条件：
                - 每日最大距离：${userConstraints.maxDistance}km
                - 偏好地形：${userConstraints.preferredTerrain}
                - 预算限制：${userConstraints.budgetLimit}元/天
                - 时间限制：${userConstraints.timeLimit}小时/天
                
                用户偏好：
                - 骑行风格：${this.userPreferences.ridingStyle}
                - 住宿类型：${this.userPreferences.accommodationType}
                
                请提供优化方案：
                1. 路线调整建议
                2. 分段规划
                3. 休息点优化
                4. 预算优化
                5. 时间分配优化
                
                返回JSON格式：
                {
                    "optimizedRoute": {
                        "waypoints": [
                            {"name": "地点", "coords": {"lat": 0, "lng": 0}, "distance": 0, "restRecommended": false}
                        ],
                        "totalDistance": 0,
                        "estimatedTime": 0
                    },
                    "dailySegments": [
                        {"day": 1, "distance": 0, "waypoints": [], "accommodation": {"name": "", "price": 0}}
                    ],
                    "optimizationReasons": ["原因1", "原因2"],
                    "benefits": ["收益1", "收益2"],
                    "tradeoffs": ["权衡1", "权衡2"]
                }
            `;
            
            const response = await this.callAI(prompt);
            const optimization = JSON.parse(response);
            
            console.log('✓ 路线优化完成');
            return optimization;
            
        } catch (error) {
            console.error('路线优化失败:', error);
            return { optimizedRoute: originalRoute, optimizationReasons: ['使用原始路线'] };
        }
    }

    // 分析天气
    async analyzeWeather(weatherData, location) {
        try {
            console.log('🌤️ AI分析天气条件...');
            
            const prompt = `
                请分析以下天气条件对骑行的影响：
                
                当前天气：
                - 地点：${location || '当前位置'}
                - 温度：${weatherData.temperature || '未知'}°C
                - 天气：${weatherData.condition || '未知'}
                - 湿度：${weatherData.humidity || '未知'}%
                - 风速：${weatherData.windSpeed || '未知'}km/h
                - 能见度：${weatherData.visibility || '未知'}km
                
                未来预报：
                ${weatherData.forecast ? weatherData.forecast.map((item, i) => 
                    `${i + 1}. ${item.time || '未来'}: ${item.condition}, ${item.temperature}°C`
                ).join('\n') : '无'}
                
                请从骑行角度分析：
                1. 当前天气适宜性 (1-10分)
                2. 安全风险评估
                3. 装备建议
                4. 出发时间建议
                5. 预防措施
                
                返回JSON格式：
                {
                    "suitability": 1-10,
                    "riskLevel": "low|medium|high",
                    "recommendations": ["建议1", "建议2"],
                    "equipment": ["装备1", "装备2"],
                    "bestDepartureTime": "HH:MM",
                    "warnings": ["警告1"],
                    "preventiveMeasures": ["措施1"]
                }
            `;
            
            const response = await this.callAI(prompt);
            const analysis = JSON.parse(response);
            
            console.log('✓ 天气分析完成');
            return analysis;
            
        } catch (error) {
            console.error('天气分析失败:', error);
            return this.getDefaultWeatherAnalysis();
        }
    }

    // 推荐住宿
    async recommendAccommodation(currentLocation, budget, preferences = {}) {
        try {
            console.log('🏨 AI推荐住宿...');
            
            const userPrefs = {
                type: preferences.type || this.userPreferences.accommodationType,
                budget: budget || this.userPreferences.dailyBudget,
                facilities: preferences.facilities || [],
                ...preferences
            };
            
            const prompt = `
                请为骑行者推荐合适的住宿：
                
                当前位置：${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}
                预算范围：${userPrefs.budget}元/晚
                住宿类型：${userPrefs.type} (budget/economy/comfort)
                
                用户需求：
                ${userPrefs.facilities.length > 0 ? userPrefs.facilities.join(', ') : '无特殊要求'}
                
                请推荐3个住宿选择，考虑：
                1. 骑行者便利性（停车、洗澡、洗衣等）
                2. 安全性
                3. 性价比
                4. 位置便利性
                
                返回JSON格式：
                {
                    "recommendations": [
                        {
                            "name": "住宿名称",
                            "type": "budget|economy|comfort",
                            "price": 价格,
                            "distance": 距离当前位置km,
                            "rating": 评分1-5,
                            "facilities": ["设施1", "设施2"],
                            "advantages": ["优势1", "优势2"],
                            "disadvantages": ["劣势1"],
                            "contact": "联系方式",
                            "recommendationReason": "推荐理由"
                        }
                    ],
                    "marketConditions": "当地住宿市场情况",
                    "bookingAdvice": "预订建议"
                }
            `;
            
            const response = await this.callAI(prompt);
            const recommendations = JSON.parse(response);
            
            console.log('✓ 住宿推荐完成');
            return recommendations;
            
        } catch (error) {
            console.error('住宿推荐失败:', error);
            return this.getDefaultAccommodationRecommendations();
        }
    }

    // 风险评估
    async assessRouteRisk(routeData, environmentalFactors = {}) {
        try {
            console.log('⚠️ AI评估路线风险...');
            
            const factors = {
                weather: environmentalFactors.weather || {},
                traffic: environmentalFactors.traffic || {},
                terrain: environmentalFactors.terrain || {},
                timeOfDay: environmentalFactors.timeOfDay || new Date().getHours(),
                userFitness: environmentalFactors.userFitness || 'medium'
            };
            
            const prompt = `
                请评估以下骑行路线的风险：
                
                路线信息：
                - 总距离：${Math.round(routeData.totalDistance || 0)}km
                - 地形：${factors.terrain.type || '混合地形'}
                - 预计时间：${Math.round((routeData.estimatedTime || 0) / 3600)}小时
                
                环境因素：
                - 天气：${factors.weather.condition || '未知'}, ${factors.weather.temperature || '未知'}°C
                - 路况：${factors.traffic.condition || '未知'}
                - 出行时间：${factors.timeOfDay}:00
                - 用户体力：${factors.userFitness}
                
                请评估以下风险：
                1. 交通安全风险
                2. 天气相关风险
                3. 体力消耗风险
                4. 环境风险
                5. 设备故障风险
                
                返回JSON格式：
                {
                    "overallRisk": 1-10,
                    "riskCategories": {
                        "traffic": {"level": 1-10, "factors": ["因素1"]},
                        "weather": {"level": 1-10, "factors": ["因素1"]},
                        "fitness": {"level": 1-10, "factors": ["因素1"]},
                        "environment": {"level": 1-10, "factors": ["因素1"]},
                        "equipment": {"level": 1-10, "factors": ["因素1"]}
                    },
                    "warnings": ["警告1"],
                    "mitigationStrategies": ["策略1"],
                    "emergencyPreparedness": ["准备1"],
                    "alternativeSuggestions": ["建议1"]
                }
            `;
            
            const response = await this.callAI(prompt);
            const riskAssessment = JSON.parse(response);
            
            console.log('✓ 风险评估完成');
            return riskAssessment;
            
        } catch (error) {
            console.error('风险评估失败:', error);
            return this.getDefaultRiskAssessment();
        }
    }

    // 学习用户偏好
    async learnUserPreferences(userAction, context) {
        try {
            const learningData = {
                action: userAction,
                context: context,
                timestamp: Date.now(),
                outcome: userAction.outcome || null
            };
            
            // 分析用户行为模式
            const pattern = await this.analyzeUserBehaviorPattern(learningData);
            
            // 更新偏好模型
            this.updatePreferenceModel(pattern);
            
            // 存储学习数据
            this.learningData.set(Date.now(), learningData);
            
            console.log('✓ 用户偏好学习完成');
            
        } catch (error) {
            console.error('用户偏好学习失败:', error);
        }
    }

    // 分析用户行为模式
    async analyzeUserBehaviorPattern(learningData) {
        const prompt = `
            分析用户行为模式：
            
            用户行为：${JSON.stringify(learningData.action)}
            上下文：${JSON.stringify(learningData.context)}
            结果：${learningData.outcome || '未知'}
            
            请分析：
            1. 用户决策偏好
            2. 风险承受能力
            3. 舒适度要求
            4. 时间观念
            5. 预算敏感度
            
            返回JSON格式：
            {
                "preferences": {
                    "riskTolerance": "low|medium|high",
                    "comfortPriority": "low|medium|high",
                    "timeSensitivity": "low|medium|high",
                    "budgetSensitivity": "low|medium|high"
                },
                "patterns": ["模式1", "模式2"],
                "recommendations": ["建议1"]
            }
        `;
        
        try {
            const response = await this.callAI(prompt);
            return JSON.parse(response);
        } catch (error) {
            console.error('行为模式分析失败:', error);
            return { preferences: {}, patterns: [], recommendations: [] };
        }
    }

    // 生成上下文
    generateContext(additionalContext = []) {
        // 保持上下文窗口大小
        const context = [...this.contextWindow, ...additionalContext];
        
        if (context.length > this.maxContextSize) {
            // 保留系统消息，删除最早的对话
            const systemMessage = context.shift();
            while (context.length > this.maxContextSize - 1) {
                context.shift();
            }
            context.unshift(systemMessage);
        }
        
        return context;
    }

    // 调用AI API
    async callAI(prompt, options = {}) {
        try {
            const context = this.generateContext([
                {
                    role: 'user',
                    content: prompt
                }
            ]);
            
            const requestBody = {
                model: this.model,
                messages: context,
                max_tokens: options.maxTokens || this.maxTokens,
                temperature: options.temperature || this.temperature,
                stream: false
            };
            
            console.log('📡 调用DeepSeek API...');
            
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            // 更新上下文窗口
            this.contextWindow = context;
            this.contextWindow.push({
                role: 'assistant',
                content: aiResponse
            });
            
            // 记录建议历史
            this.suggestionHistory.push({
                prompt: prompt,
                response: aiResponse,
                timestamp: Date.now()
            });
            
            console.log('✓ AI响应成功');
            return aiResponse;
            
        } catch (error) {
            console.error('AI API调用失败:', error);
            throw error;
        }
    }

    // 获取智能建议
    async getSmartSuggestions(currentData) {
        try {
            const prompt = `
                基于当前数据提供智能建议：
                
                当前状态：
                - 位置：${currentData.location ? `${currentData.location.lat.toFixed(4)}, ${currentData.location.lng.toFixed(4)}` : '未知'}
                - 进度：${currentData.trip?.todayDistance || 0}/${this.userPreferences.ridingPreferences?.dailyDistance || 120}km
                - 速度：${currentData.trip?.averageSpeed || 0}km/h
                - 天气：${currentData.weather?.condition || '未知'}
                - 电量：${currentData.environment?.battery ? Math.round(currentData.environment.battery * 100) : '未知'}%
                
                请提供3-5个智能建议，按优先级排序：
                1. 立即行动建议
                2. 短期规划建议
                3. 长期优化建议
                
                返回JSON格式：
                {
                    "suggestions": [
                        {
                            "priority": "high|medium|low",
                            "type": "immediate|planning|optimization",
                            "title": "建议标题",
                            "content": "具体建议内容",
                            "actionable": true,
                            "autoExecute": false
                        }
                    ],
                    "insights": ["洞察1"],
                    "alerts": ["提醒1"]
                }
            `;
            
            const response = await this.callAI(prompt);
            const suggestions = JSON.parse(response);
            
            console.log('✓ 智能建议生成完成');
            return suggestions;
            
        } catch (error) {
            console.error('智能建议生成失败:', error);
            return this.getDefaultSuggestions();
        }
    }

    // 默认分析结果
    getDefaultAnalysis() {
        return {
            difficulty: 5,
            riskLevel: 'medium',
            weatherAdaptability: 5,
            suggestions: ['保持当前节奏', '注意安全'],
            restPoints: [],
            warnings: [],
            optimizations: []
        };
    }

    // 默认天气分析
    getDefaultWeatherAnalysis() {
        return {
            suitability: 5,
            riskLevel: 'medium',
            recommendations: ['注意观察天气变化'],
            equipment: ['头盔', '水壶'],
            bestDepartureTime: '08:00',
            warnings: [],
            preventiveMeasures: []
        };
    }

    // 默认住宿推荐
    getDefaultAccommodationRecommendations() {
        return {
            recommendations: [
                {
                    name: '经济型旅馆',
                    type: 'budget',
                    price: 80,
                    distance: 5,
                    rating: 3,
                    facilities: ['WiFi', '热水'],
                    advantages: ['价格实惠'],
                    disadvantages: ['设施简单'],
                    contact: '电话咨询',
                    recommendationReason: '符合预算要求'
                }
            ],
            marketConditions: '住宿选择正常',
            bookingAdvice: '建议提前预订'
        };
    }

    // 默认风险评估
    getDefaultRiskAssessment() {
        return {
            overallRisk: 5,
            riskCategories: {
                traffic: { level: 3, factors: ['正常交通'] },
                weather: { level: 3, factors: ['正常天气'] },
                fitness: { level: 3, factors: ['体力充足'] },
                environment: { level: 3, factors: ['环境正常'] },
                equipment: { level: 3, factors: ['设备正常'] }
            },
            warnings: [],
            mitigationStrategies: ['保持警惕'],
            emergencyPreparedness: ['携带急救包'],
            alternativeSuggestions: []
        };
    }

    // 默认建议
    getDefaultSuggestions() {
        return {
            suggestions: [
                {
                    priority: 'medium',
                    type: 'planning',
                    title: '继续保持',
                    content: '当前状态良好，建议保持现有节奏',
                    actionable: false,
                    autoExecute: false
                }
            ],
            insights: ['数据不足，使用默认建议'],
            alerts: []
        };
    }

    // 获取AI状态
    getAIStatus() {
        return {
            isInitialized: this.isInitialized,
            contextSize: this.contextWindow.length,
            learningDataSize: this.learningData.size,
            suggestionHistorySize: this.suggestionHistory.length,
            activeModules: Object.keys(this.modules).filter(key => this.modules[key] !== null)
        };
    }

    // 清理AI助手
    destroy() {
        this.contextWindow = [];
        this.learningData.clear();
        this.suggestionHistory = [];
        
        console.log('AI助手已清理');
    }
}

// 创建AI助手实例
const aiAssistant = new AIAssistant();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAssistant;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.AIAssistant = AIAssistant;
    window.aiAssistant = aiAssistant;
}