import { isSupabaseConfigured } from "./server-auth";
import { createAdminClient } from "./admin";

export interface DBProject {
  id: string;
  userId: string;
  name: string;
  description: string;
  blenderVersion: string;
  createdAt: string;
  updatedAt: string;
  generationCount: number;
}

export interface DBGeneration {
  id: string;
  projectId: string;
  userId: string;
  versionNumber: number;
  prompt: string;
  mode: string;
  style: string;
  complexity: string;
  planJson: any;
  code: string;
  warnings: string[];
  createdAt: string;
}

export interface DBConversation {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: any;
  imageUrl?: string;
  metadata?: any;
  createdAt: string;
}

export interface DBExecution {
  id: string;
  generationId: string;
  projectId: string;
  userId: string;
  status: "pending" | "claimed" | "running" | "success" | "error" | "cancelled";
  script: string;
  prompt: string;
  blenderVersion: string;
  stdout: string;
  stderr: string;
  durationMs: number | null;
  createdAt: string;
  claimedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface DBExecutionEvent {
  id: string;
  executionId: string;
  eventType: string;
  payload: any;
  createdAt: string;
}

export interface DBBlenderDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  blenderVersion: string;
  addonVersion: string;
  status: "CONNECTED" | "IDLE" | "BUSY" | "EXECUTING" | "ERROR" | "OFFLINE";
  currentProjectId?: string | null;
  currentExecutionId?: string | null;
  lastSeen: string;
  createdAt: string;
}

export interface DBSceneSnapshot {
  id: string;
  projectId: string;
  userId: string;
  sceneName: string;
  blenderVersion: string;
  snapshotJson: any;
  createdAt: string;
}

export interface DBGenerationVersion {
  id: string;
  projectId: string;
  generationId?: string | null;
  userId: string;
  versionNumber: number;
  prompt: string;
  code: string;
  planJson: any;
  parentVersionId?: string | null;
  glbUrl?: string | null;
  snapshotJson?: any | null;
  createdAt: string;
}

export interface DBTemplate {
  id: string;
  title: string;
  description: string;
  category: "Furniture" | "Architecture" | "Game Assets" | "Product Design" | "Characters" | "Other";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  thumbnailUrl?: string;
  startingPrompt: string;
  starterCode: string;
  starterPlan: any;
  isOfficial: boolean;
  createdAt: string;
}

export interface DBAiUsage {
  id: string;
  userId: string;
  projectId?: string | null;
  model: string;
  operationType: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  createdAt: string;
}

// ==============================================================================
// In-Memory Fallback Data Store (Partitioned strictly by userId for isolation)
// ==============================================================================
class FallbackDataStore {
  private projects: DBProject[] = [
    {
      id: "proj_cyberpunk_desk",
      userId: "usr_demo_artist",
      name: "Cyberpunk Desk Setup",
      description: "Modular futuristic gaming desk with RGB underglow and cable trays",
      blenderVersion: "4.x",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 1,
    },
  ];

  private generations: DBGeneration[] = [
    {
      id: "gen_base_1",
      projectId: "proj_cyberpunk_desk",
      userId: "usr_demo_artist",
      versionNumber: 1,
      prompt: "Create a futuristic gaming desk with monitor and RGB lighting",
      mode: "create",
      style: "sci-fi",
      complexity: "medium",
      planJson: {
        intent: "create_model",
        summary: "Modular futuristic gaming desk with beveled chamfers and cable grommets.",
        objects: [
          {
            name: "Cyber_Desk_Surface",
            type: "mesh",
            description: "Main workspace surface",
            approxDimensions: { x: 1.6, y: 0.8, z: 0.05 },
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: "Build desktop surface",
            instructions: "Create cube and scale to 1.6m x 0.8m x 0.05m",
            targetObject: "Cyber_Desk_Surface",
            operationType: "primitive",
          },
        ],
        materials: [
          {
            name: "Dark_Matte_Carbon",
            targetObject: "Cyber_Desk_Surface",
            roughness: 0.3,
            metallic: 0.8,
          },
        ],
        lighting: [],
        camera: undefined,
        assumptions: [],
        warnings: [],
        blenderCode: `# SculptorAI Generated Script\nimport bpy\n\ndef main():\n    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':\n        bpy.ops.object.mode_set(mode='OBJECT')\n    bpy.ops.object.select_all(action='DESELECT')\n    for obj in bpy.data.objects:\n        if obj.type == 'MESH':\n            obj.select_set(True)\n    bpy.ops.object.delete(use_global=False)\n    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.75))\n    desk = bpy.context.active_object\n    desk.name = "Cyber_Desk_Surface"\n    desk.scale = (1.6, 0.8, 0.05)\n    bpy.ops.object.transform_apply(scale=True)\n\nif __name__ == '__main__':\n    main()\n`,
      },
      code: `# SculptorAI Generated Script\nimport bpy\n\ndef main():\n    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':\n        bpy.ops.object.mode_set(mode='OBJECT')\n    bpy.ops.object.select_all(action='DESELECT')\n    for obj in bpy.data.objects:\n        if obj.type == 'MESH':\n            obj.select_set(True)\n    bpy.ops.object.delete(use_global=False)\n    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.75))\n    desk = bpy.context.active_object\n    desk.name = "Cyber_Desk_Surface"\n    desk.scale = (1.6, 0.8, 0.05)\n    bpy.ops.object.transform_apply(scale=True)\n\nif __name__ == '__main__':\n    main()\n`,
      warnings: [],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];

  private conversations: DBConversation[] = [
    {
      id: "conv_cyberpunk_desk",
      projectId: "proj_cyberpunk_desk",
      userId: "usr_demo_artist",
      title: "Cyberpunk Desk Setup Discussion",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private messages: DBMessage[] = [
    {
      id: "msg_init",
      conversationId: "conv_cyberpunk_desk",
      userId: "usr_demo_artist",
      role: "assistant",
      content: { text: "Welcome to SculptorAI Studio. Describe what you want to model or refine, or upload a reference image for procedural reconstruction." },
      createdAt: new Date().toISOString(),
    },
  ];

  private executions: DBExecution[] = [];
  private executionEvents: DBExecutionEvent[] = [];

  // Projects
  async getProjects(userId: string): Promise<DBProject[]> {
    return this.projects
      .filter((p) => p.userId === userId)
      .map((p) => ({
        ...p,
        generationCount: this.generations.filter((g) => g.projectId === p.id && g.userId === userId).length,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getProjectById(projectId: string, userId: string): Promise<DBProject | null> {
    const proj = this.projects.find((p) => p.id === projectId && p.userId === userId);
    if (!proj) return null;
    return {
      ...proj,
      generationCount: this.generations.filter((g) => g.projectId === proj.id && g.userId === userId).length,
    };
  }

  async createProject(data: { userId: string; name: string; description?: string; blenderVersion?: string }): Promise<DBProject> {
    const now = new Date().toISOString();
    const newProj: DBProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: data.userId,
      name: data.name,
      description: data.description || "",
      blenderVersion: data.blenderVersion || "4.x",
      createdAt: now,
      updatedAt: now,
      generationCount: 0,
    };
    this.projects.unshift(newProj);
    return newProj;
  }

  async updateProject(projectId: string, userId: string, data: { name?: string; description?: string; blenderVersion?: string }): Promise<DBProject | null> {
    const proj = this.projects.find((p) => p.id === projectId && p.userId === userId);
    if (!proj) return null;
    if (data.name !== undefined) proj.name = data.name;
    if (data.description !== undefined) proj.description = data.description;
    if (data.blenderVersion !== undefined) proj.blenderVersion = data.blenderVersion;
    proj.updatedAt = new Date().toISOString();
    return {
      ...proj,
      generationCount: this.generations.filter((g) => g.projectId === proj.id && g.userId === userId).length,
    };
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    const initialLen = this.projects.length;
    this.projects = this.projects.filter((p) => !(p.id === projectId && p.userId === userId));
    if (this.projects.length !== initialLen) {
      this.generations = this.generations.filter((g) => g.projectId !== projectId);
      this.executions = this.executions.filter((e) => e.projectId !== projectId);
      return true;
    }
    return false;
  }

  // Generations
  async getGenerations(projectId: string, userId: string): Promise<DBGeneration[]> {
    return this.generations
      .filter((g) => g.projectId === projectId && g.userId === userId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async createGeneration(data: {
    projectId: string;
    userId: string;
    versionNumber: number;
    prompt: string;
    mode?: string;
    style?: string;
    complexity?: string;
    planJson: any;
    code: string;
    warnings?: string[];
  }): Promise<DBGeneration> {
    const now = new Date().toISOString();
    const newGen: DBGeneration = {
      id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      projectId: data.projectId,
      userId: data.userId,
      versionNumber: data.versionNumber,
      prompt: data.prompt,
      mode: data.mode || "create",
      style: data.style || "low-poly",
      complexity: data.complexity || "medium",
      planJson: data.planJson,
      code: data.code,
      warnings: data.warnings || [],
      createdAt: now,
    };
    this.generations.unshift(newGen);

    // Update project updatedAt
    const proj = this.projects.find((p) => p.id === data.projectId && p.userId === data.userId);
    if (proj) proj.updatedAt = now;

    return newGen;
  }

  // Conversations & Messages
  async getOrCreateConversation(projectId: string, userId: string): Promise<DBConversation> {
    let conv = this.conversations.find((c) => c.projectId === projectId && c.userId === userId);
    if (!conv) {
      conv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        projectId,
        userId,
        title: "Studio AI Conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.conversations.push(conv);
    }
    return conv;
  }

  async getMessages(conversationId: string, userId: string): Promise<DBMessage[]> {
    return this.messages
      .filter((m) => m.conversationId === conversationId && m.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async addMessage(data: {
    conversationId: string;
    userId: string;
    role: "user" | "assistant" | "system";
    content: any;
    imageUrl?: string;
    metadata?: any;
  }): Promise<DBMessage> {
    const newMsg: DBMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      conversationId: data.conversationId,
      userId: data.userId,
      role: data.role,
      content: data.content,
      imageUrl: data.imageUrl,
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(newMsg);
    return newMsg;
  }

  // Executions
  async createExecution(data: {
    generationId: string;
    projectId: string;
    userId: string;
    blenderVersion?: string;
    script: string;
    prompt: string;
  }): Promise<DBExecution> {
    const now = new Date().toISOString();
    const execId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record: DBExecution = {
      id: execId,
      generationId: data.generationId,
      projectId: data.projectId,
      userId: data.userId,
      status: "pending",
      script: data.script,
      prompt: data.prompt,
      blenderVersion: data.blenderVersion || "4.x",
      stdout: "",
      stderr: "",
      durationMs: null,
      createdAt: now,
      claimedAt: null,
      startedAt: null,
      completedAt: null,
    };
    this.executions.unshift(record);

    this.executionEvents.push({
      id: `evt_${Date.now()}_1`,
      executionId: execId,
      eventType: "created",
      payload: { prompt: data.prompt, blenderVersion: data.blenderVersion },
      createdAt: now,
    });

    return record;
  }

  async getExecutions(userId: string, filter?: { status?: string; projectId?: string }): Promise<DBExecution[]> {
    let list = this.executions.filter((e) => e.userId === userId);
    if (filter?.status) {
      list = list.filter((e) => e.status === filter.status);
    }
    if (filter?.projectId) {
      list = list.filter((e) => e.projectId === filter.projectId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getExecutionById(executionId: string, userId: string): Promise<DBExecution | null> {
    return this.executions.find((e) => e.id === executionId && e.userId === userId) || null;
  }

  // Atomic Claim of Next Pending Task
  async claimNextExecution(userId: string, blenderVersion: string = "4.x"): Promise<DBExecution | null> {
    // Find oldest pending execution
    const pendingList = this.executions
      .filter((e) => e.userId === userId && e.status === "pending")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (pendingList.length === 0) return null;

    const task = pendingList[0];
    task.status = "claimed";
    task.claimedAt = new Date().toISOString();

    this.executionEvents.push({
      id: `evt_${Date.now()}`,
      executionId: task.id,
      eventType: "claimed",
      payload: { claimedAt: task.claimedAt, blenderVersion },
      createdAt: task.claimedAt,
    });

    return task;
  }

  // Atomic Claim of Specific Execution ID
  async claimExecutionById(executionId: string, userId: string, blenderVersion: string = "4.x"): Promise<DBExecution | null> {
    const task = this.executions.find((e) => e.id === executionId && e.userId === userId);
    if (!task) return null;
    if (task.status !== "pending") return null; // Already claimed or processed

    task.status = "claimed";
    task.claimedAt = new Date().toISOString();

    this.executionEvents.push({
      id: `evt_${Date.now()}`,
      executionId: task.id,
      eventType: "claimed",
      payload: { claimedAt: task.claimedAt, blenderVersion },
      createdAt: task.claimedAt,
    });

    return task;
  }

  async startExecution(executionId: string, userId: string): Promise<DBExecution | null> {
    const task = this.executions.find((e) => e.id === executionId && e.userId === userId);
    if (!task) return null;
    if (task.status !== "claimed" && task.status !== "pending") return null;

    task.status = "running";
    task.startedAt = new Date().toISOString();

    this.executionEvents.push({
      id: `evt_${Date.now()}`,
      executionId: task.id,
      eventType: "started",
      payload: { startedAt: task.startedAt },
      createdAt: task.startedAt,
    });

    return task;
  }

  async completeExecution(
    executionId: string,
    userId: string,
    data: {
      status: "success" | "error";
      stdout?: string;
      stderr?: string;
      durationMs?: number | null;
      blenderVersion?: string;
    }
  ): Promise<DBExecution | null> {
    const task = this.executions.find((e) => e.id === executionId && e.userId === userId);
    if (!task) return null;

    const now = new Date().toISOString();
    task.status = data.status;
    task.stdout = data.stdout || "";
    task.stderr = data.stderr || "";
    task.durationMs = data.durationMs ?? null;
    task.completedAt = now;
    if (data.blenderVersion) task.blenderVersion = data.blenderVersion;

    this.executionEvents.push({
      id: `evt_${Date.now()}`,
      executionId: task.id,
      eventType: "completed",
      payload: {
        status: data.status,
        durationMs: data.durationMs,
        completedAt: now,
      },
      createdAt: now,
    });

    return task;
  }

  async cancelExecution(executionId: string, userId: string): Promise<DBExecution | null> {
    const task = this.executions.find((e) => e.id === executionId && e.userId === userId);
    if (!task) return null;
    if (task.status === "success" || task.status === "error" || task.status === "cancelled") {
      return null;
    }

    const now = new Date().toISOString();
    task.status = "cancelled";
    task.completedAt = now;

    this.executionEvents.push({
      id: `evt_${Date.now()}`,
      executionId: task.id,
      eventType: "cancelled",
      payload: { cancelledAt: now },
      createdAt: now,
    });

    return task;
  }

  // Dashboard Stats
  async getDashboardStats(userId: string) {
    const userProjects = this.projects.filter((p) => p.userId === userId);
    const userGenerations = this.generations.filter((g) => g.userId === userId);
    const userExecutions = this.executions.filter((e) => e.userId === userId);

    const successExecs = userExecutions.filter((e) => e.status === "success").length;
    const errorExecs = userExecutions.filter((e) => e.status === "error").length;

    const recentGenerations = userGenerations.slice(0, 5).map((g) => {
      const proj = userProjects.find((p) => p.id === g.projectId);
      return {
        id: g.id,
        title: g.prompt,
        projectName: proj?.name || "Blender Project",
        status: "Completed",
        createdAt: g.createdAt,
      };
    });

    return {
      totalProjects: userProjects.length,
      totalGenerations: userGenerations.length,
      successfulExecutions: successExecs,
      failedExecutions: errorExecs,
      recentGenerations,
    };
  }

  // Blender Devices & Heartbeat
  private devices: DBBlenderDevice[] = [];

  recordHeartbeat(data: {
    userId: string;
    deviceId: string;
    deviceName?: string;
    blenderVersion?: string;
    addonVersion?: string;
    status: string;
    currentProjectId?: string;
    currentExecutionId?: string;
  }): DBBlenderDevice {
    const existingIdx = this.devices.findIndex(
      (d) => d.userId === data.userId && d.deviceId === data.deviceId
    );
    const now = new Date().toISOString();
    const device: DBBlenderDevice = {
      id: existingIdx >= 0 ? this.devices[existingIdx].id : `dev_${Date.now()}`,
      userId: data.userId,
      deviceId: data.deviceId,
      deviceName: data.deviceName || "Blender Workstation",
      blenderVersion: data.blenderVersion || "4.x",
      addonVersion: data.addonVersion || "1.1.0",
      status: (data.status as any) || "IDLE",
      currentProjectId: data.currentProjectId || null,
      currentExecutionId: data.currentExecutionId || null,
      lastSeen: now,
      createdAt: existingIdx >= 0 ? this.devices[existingIdx].createdAt : now,
    };

    if (existingIdx >= 0) {
      this.devices[existingIdx] = device;
    } else {
      this.devices.push(device);
    }
    return device;
  }

  getDeviceStatus(userId: string): {
    status: "CONNECTED" | "IDLE" | "BUSY" | "EXECUTING" | "ERROR" | "OFFLINE";
    device: DBBlenderDevice | null;
  } {
    const userDevices = this.devices
      .filter((d) => d.userId === userId)
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    if (userDevices.length === 0) {
      return { status: "OFFLINE", device: null };
    }

    const latest = userDevices[0];
    const diffMs = Date.now() - new Date(latest.lastSeen).getTime();

    // Consider device offline if no heartbeat within 45 seconds
    if (diffMs > 45000) {
      return { status: "OFFLINE", device: { ...latest, status: "OFFLINE" } };
    }

    return { status: latest.status, device: latest };
  }

  // Scene Snapshots
  private snapshots: DBSceneSnapshot[] = [];

  saveSnapshot(data: {
    userId: string;
    projectId: string;
    sceneName?: string;
    blenderVersion?: string;
    snapshot: any;
  }): DBSceneSnapshot {
    const record: DBSceneSnapshot = {
      id: `snap_${Date.now()}`,
      projectId: data.projectId,
      userId: data.userId,
      sceneName: data.sceneName || "Scene",
      blenderVersion: data.blenderVersion || "4.x",
      snapshotJson: data.snapshot,
      createdAt: new Date().toISOString(),
    };
    this.snapshots.push(record);
    return record;
  }

  getLatestSnapshot(projectId: string, userId: string): DBSceneSnapshot | null {
    const list = this.snapshots
      .filter((s) => s.projectId === projectId && s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list[0] || null;
  }

  // Generation Versions
  private versions: DBGenerationVersion[] = [];

  saveVersion(data: {
    userId: string;
    projectId: string;
    generationId?: string;
    versionNumber: number;
    prompt: string;
    code: string;
    planJson: any;
    parentVersionId?: string;
    glbUrl?: string;
    snapshotJson?: any;
  }): DBGenerationVersion {
    const record: DBGenerationVersion = {
      id: `ver_${Date.now()}_${data.versionNumber}`,
      projectId: data.projectId,
      generationId: data.generationId || null,
      userId: data.userId,
      versionNumber: data.versionNumber,
      prompt: data.prompt,
      code: data.code,
      planJson: data.planJson,
      parentVersionId: data.parentVersionId || null,
      glbUrl: data.glbUrl || null,
      snapshotJson: data.snapshotJson || null,
      createdAt: new Date().toISOString(),
    };
    this.versions.push(record);
    return record;
  }

  getVersions(projectId: string, userId: string): DBGenerationVersion[] {
    return this.versions
      .filter((v) => v.projectId === projectId && v.userId === userId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  // Templates
  private templates: DBTemplate[] = [
    {
      id: "tpl_gaming_desk",
      title: "Modular Cyberpunk Desk",
      description: "Clean dual-level gaming desk with cable trays and monitor riser",
      category: "Furniture",
      difficulty: "Beginner",
      tags: ["desk", "gaming", "workspace", "furniture"],
      startingPrompt: "Create a modern futuristic gaming desk with monitor riser and cable management grommets",
      starterCode: `import bpy\n\ndef main():\n    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.75))\n    desk = bpy.context.active_object\n    desk.name = "Gaming_Desk"\n    desk.scale = (1.6, 0.8, 0.05)\n    bpy.ops.object.transform_apply(scale=True)\n\nif __name__ == '__main__':\n    main()`,
      starterPlan: { summary: "Modular gaming desk baseline", objects: [{ name: "Gaming_Desk", type: "mesh" }] },
      isOfficial: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_ergo_chair",
      title: "Ergonomic Task Chair",
      description: "Contoured mesh office chair with lumbar curve and star caster base",
      category: "Furniture",
      difficulty: "Intermediate",
      tags: ["chair", "office", "ergonomic"],
      startingPrompt: "Create an ergonomic office chair with contoured seat and star caster base",
      starterCode: `import bpy\n\ndef main():\n    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.5))\n    seat = bpy.context.active_object\n    seat.name = "Chair_Seat"\n    seat.scale = (0.5, 0.5, 0.05)\n    bpy.ops.object.transform_apply(scale=True)\n\nif __name__ == '__main__':\n    main()`,
      starterPlan: { summary: "Ergonomic chair geometry", objects: [{ name: "Chair_Seat", type: "mesh" }] },
      isOfficial: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_sci_fi_corridor",
      title: "Sci-Fi Modular Corridor",
      description: "Atmospheric bulkhead archway with recessed floor grates and wall conduits",
      category: "Architecture",
      difficulty: "Advanced",
      tags: ["architecture", "sci-fi", "modular", "environment"],
      startingPrompt: "Create a modular sci-fi hallway segment with octagonal bulkhead arch and wall conduits",
      starterCode: `import bpy\n\ndef main():\n    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=2.0, depth=3.0, location=(0, 0, 1.5))\n    arch = bpy.context.active_object\n    arch.name = "Corridor_Arch"\n\nif __name__ == '__main__':\n    main()`,
      starterPlan: { summary: "Modular octagonal sci-fi corridor arch", objects: [{ name: "Corridor_Arch", type: "mesh" }] },
      isOfficial: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_hover_vehicle",
      title: "Cyberpunk Hover Speeder",
      description: "Aerodynamic low-poly hover vehicle with twin side turbines and cockpit canopy",
      category: "Game Assets",
      difficulty: "Intermediate",
      tags: ["vehicle", "cyberpunk", "speed", "game asset"],
      startingPrompt: "Create an aerodynamic cyberpunk hover vehicle with twin thrusters and angular cockpit",
      starterCode: `import bpy\n\ndef main():\n    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.4))\n    body = bpy.context.active_object\n    body.name = "Speeder_Body"\n    body.scale = (2.2, 0.9, 0.4)\n    bpy.ops.object.transform_apply(scale=True)\n\nif __name__ == '__main__':\n    main()`,
      starterPlan: { summary: "Low-poly hover vehicle chassis", objects: [{ name: "Speeder_Body", type: "mesh" }] },
      isOfficial: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_headphones",
      title: "Studio Over-Ear Headphones",
      description: "Industrial design audio headset with cushioned headband and gimbal earcups",
      category: "Product Design",
      difficulty: "Intermediate",
      tags: ["product", "audio", "industrial design"],
      startingPrompt: "Create modern over-ear studio headphones with curved headband and circular earcups",
      starterCode: `import bpy\n\ndef main():\n    bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.015, location=(0, 0, 0.2))\n    band = bpy.context.active_object\n    band.name = "Headband"\n\nif __name__ == '__main__':\n    main()`,
      starterPlan: { summary: "Over-ear headphone chassis", objects: [{ name: "Headband", type: "mesh" }] },
      isOfficial: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_lowpoly_robot",
      title: "Articulated Low-Poly Robot",
      description: "Charming mechanical companion droid with spherical torso and visor eye",
      category: "Characters",
      difficulty: "Beginner",
      tags: ["character", "robot", "low-poly", "droid"],
      startingPrompt: "Create a cute low-poly companion robot with spherical body and glowing visor",
      starterCode: `import bpy\n\ndef main():\n    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(0, 0, 1.0))\n    bot = bpy.context.active_object\n    bot.name = "Companion_Droid"\n\nif __name__ == '__main__':\n    main()`,
      starterPlan: { summary: "Companion droid mesh", objects: [{ name: "Companion_Droid", type: "mesh" }] },
      isOfficial: true,
      createdAt: new Date().toISOString(),
    }
  ];

  getTemplates(category?: string): DBTemplate[] {
    if (!category || category === "All") return this.templates;
    return this.templates.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }

  // AI Usage
  private aiUsages: DBAiUsage[] = [];

  trackAiUsage(data: {
    userId: string;
    projectId?: string;
    model: string;
    operationType: string;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  }): DBAiUsage {
    const record: DBAiUsage = {
      id: `usage_${Date.now()}`,
      userId: data.userId,
      projectId: data.projectId || null,
      model: data.model,
      operationType: data.operationType,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      estimatedCostUsd: data.estimatedCostUsd,
      createdAt: new Date().toISOString(),
    };
    this.aiUsages.push(record);
    return record;
  }

  getAiUsageSummary(userId: string) {
    const userEvents = this.aiUsages.filter((u) => u.userId === userId);
    const totalPromptTokens = userEvents.reduce((acc, u) => acc + u.promptTokens, 0);
    const totalCompletionTokens = userEvents.reduce((acc, u) => acc + u.completionTokens, 0);
    const totalCostUsd = userEvents.reduce((acc, u) => acc + Number(u.estimatedCostUsd), 0);

    return {
      totalGenerations: userEvents.filter((u) => u.operationType === "generation").length,
      totalImageAnalyses: userEvents.filter((u) => u.operationType === "vision").length,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      events: userEvents.slice(-20),
    };
  }
}

// Global fallback singleton for dev/testing when Supabase credentials are not live
const fallbackStore = new FallbackDataStore();

// ==============================================================================
// Database Access Facade (Routes to Supabase or Fallback)
// ==============================================================================
export const db = {
  // Projects
  async getProjects(userId: string): Promise<DBProject[]> {
    if (!isSupabaseConfigured()) return fallbackStore.getProjects(userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          user_id,
          name,
          description,
          blender_version,
          created_at,
          updated_at,
          generations (count)
        `)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error || !data) {
        console.warn("[Supabase getProjects error, falling back]:", error);
        return fallbackStore.getProjects(userId);
      }

      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description || "",
        blenderVersion: row.blender_version || "4.x",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        generationCount: row.generations?.[0]?.count ?? 0,
      }));
    } catch {
      return fallbackStore.getProjects(userId);
    }
  },

  async getProjectById(projectId: string, userId: string): Promise<DBProject | null> {
    if (!isSupabaseConfigured()) return fallbackStore.getProjectById(projectId, userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          user_id,
          name,
          description,
          blender_version,
          created_at,
          updated_at,
          generations (count)
        `)
        .eq("id", projectId)
        .eq("user_id", userId)
        .single();

      if (error || !data) return fallbackStore.getProjectById(projectId, userId);

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || "",
        blenderVersion: data.blender_version || "4.x",
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        generationCount: data.generations?.[0]?.count ?? 0,
      };
    } catch {
      return fallbackStore.getProjectById(projectId, userId);
    }
  },

  async createProject(data: { userId: string; name: string; description?: string; blenderVersion?: string }): Promise<DBProject> {
    if (!isSupabaseConfigured()) return fallbackStore.createProject(data);

    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase
        .from("projects")
        .insert({
          user_id: data.userId,
          name: data.name,
          description: data.description || "",
          blender_version: data.blenderVersion || "4.x",
        })
        .select()
        .single();

      if (error || !created) {
        console.warn("[Supabase createProject error, falling back]:", error);
        return fallbackStore.createProject(data);
      }

      return {
        id: created.id,
        userId: created.user_id,
        name: created.name,
        description: created.description || "",
        blenderVersion: created.blender_version || "4.x",
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        generationCount: 0,
      };
    } catch {
      return fallbackStore.createProject(data);
    }
  },

  async updateProject(projectId: string, userId: string, data: { name?: string; description?: string; blenderVersion?: string }): Promise<DBProject | null> {
    if (!isSupabaseConfigured()) return fallbackStore.updateProject(projectId, userId, data);

    try {
      const supabase = createAdminClient();
      const updates: any = { updated_at: new Date().toISOString() };
      if (data.name !== undefined) updates.name = data.name;
      if (data.description !== undefined) updates.description = data.description;
      if (data.blenderVersion !== undefined) updates.blender_version = data.blenderVersion;

      const { data: updated, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error || !updated) return fallbackStore.updateProject(projectId, userId, data);

      return {
        id: updated.id,
        userId: updated.user_id,
        name: updated.name,
        description: updated.description || "",
        blenderVersion: updated.blender_version || "4.x",
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        generationCount: 0,
      };
    } catch {
      return fallbackStore.updateProject(projectId, userId, data);
    }
  },

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return fallbackStore.deleteProject(projectId, userId);

    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("user_id", userId);

      if (error) {
        console.warn("[Supabase deleteProject error, falling back]:", error);
        return fallbackStore.deleteProject(projectId, userId);
      }
      return true;
    } catch {
      return fallbackStore.deleteProject(projectId, userId);
    }
  },

  // Generations
  async getGenerations(projectId: string, userId: string): Promise<DBGeneration[]> {
    if (!isSupabaseConfigured()) return fallbackStore.getGenerations(projectId, userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .order("version_number", { ascending: false });

      if (error || !data) return fallbackStore.getGenerations(projectId, userId);

      return data.map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        versionNumber: row.version_number || 1,
        prompt: row.prompt,
        mode: row.mode || "create",
        style: row.style || "low-poly",
        complexity: row.complexity || "medium",
        planJson: row.plan_json || row.model_plan || {},
        code: row.code || "",
        warnings: Array.isArray(row.warnings) ? row.warnings : [],
        createdAt: row.created_at,
      }));
    } catch {
      return fallbackStore.getGenerations(projectId, userId);
    }
  },

  async createGeneration(data: {
    projectId: string;
    userId: string;
    versionNumber: number;
    prompt: string;
    mode?: string;
    style?: string;
    complexity?: string;
    planJson: any;
    code: string;
    warnings?: string[];
  }): Promise<DBGeneration> {
    if (!isSupabaseConfigured()) return fallbackStore.createGeneration(data);

    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase
        .from("generations")
        .insert({
          project_id: data.projectId,
          user_id: data.userId,
          version_number: data.versionNumber,
          prompt: data.prompt,
          mode: data.mode || "create",
          style: data.style || "low-poly",
          complexity: data.complexity || "medium",
          model_plan: data.planJson,
          plan_json: data.planJson,
          code: data.code,
          warnings: data.warnings || [],
          status: "completed",
        })
        .select()
        .single();

      if (error || !created) {
        console.warn("[Supabase createGeneration error, falling back]:", error);
        return fallbackStore.createGeneration(data);
      }

      // Update project updated_at
      await supabase
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.projectId);

      return {
        id: created.id,
        projectId: created.project_id,
        userId: created.user_id,
        versionNumber: created.version_number || data.versionNumber,
        prompt: created.prompt,
        mode: created.mode || "create",
        style: created.style || "low-poly",
        complexity: created.complexity || "medium",
        planJson: created.plan_json || created.model_plan || data.planJson,
        code: created.code,
        warnings: created.warnings || [],
        createdAt: created.created_at,
      };
    } catch {
      return fallbackStore.createGeneration(data);
    }
  },

  // Conversations & Messages
  async getOrCreateConversation(projectId: string, userId: string): Promise<DBConversation> {
    if (!isSupabaseConfigured()) return fallbackStore.getOrCreateConversation(projectId, userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          projectId: data.project_id,
          userId: data.user_id,
          title: data.title,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }

      const { data: created, error: createErr } = await supabase
        .from("conversations")
        .insert({
          project_id: projectId,
          user_id: userId,
          title: "Studio AI Conversation",
        })
        .select()
        .single();

      if (createErr || !created) return fallbackStore.getOrCreateConversation(projectId, userId);

      return {
        id: created.id,
        projectId: created.project_id,
        userId: created.user_id,
        title: created.title,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      };
    } catch {
      return fallbackStore.getOrCreateConversation(projectId, userId);
    }
  },

  async getMessages(conversationId: string, userId: string): Promise<DBMessage[]> {
    if (!isSupabaseConfigured()) return fallbackStore.getMessages(conversationId, userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error || !data) return fallbackStore.getMessages(conversationId, userId);

      return data.map((row: any) => ({
        id: row.id,
        conversationId: row.conversation_id,
        userId: row.user_id,
        role: row.role,
        content: row.content,
        imageUrl: row.image_url,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));
    } catch {
      return fallbackStore.getMessages(conversationId, userId);
    }
  },

  async addMessage(data: {
    conversationId: string;
    userId: string;
    role: "user" | "assistant" | "system";
    content: any;
    imageUrl?: string;
    metadata?: any;
  }): Promise<DBMessage> {
    if (!isSupabaseConfigured()) return fallbackStore.addMessage(data);

    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: data.conversationId,
          user_id: data.userId,
          role: data.role,
          content: data.content,
          image_url: data.imageUrl || null,
          metadata: data.metadata || {},
        })
        .select()
        .single();

      if (error || !created) return fallbackStore.addMessage(data);

      return {
        id: created.id,
        conversationId: created.conversation_id,
        userId: created.user_id,
        role: created.role,
        content: created.content,
        imageUrl: created.image_url,
        metadata: created.metadata,
        createdAt: created.created_at,
      };
    } catch {
      return fallbackStore.addMessage(data);
    }
  },

  // Executions
  async createExecution(data: {
    generationId: string;
    projectId: string;
    userId: string;
    blenderVersion?: string;
    script: string;
    prompt: string;
  }): Promise<DBExecution> {
    if (!isSupabaseConfigured()) return fallbackStore.createExecution(data);

    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase
        .from("executions")
        .insert({
          generation_id: data.generationId,
          project_id: data.projectId,
          user_id: data.userId,
          status: "pending",
          script: data.script,
          prompt: data.prompt,
          blender_version: data.blenderVersion || "4.x",
        })
        .select()
        .single();

      if (error || !created) return fallbackStore.createExecution(data);

      // Audit event
      await supabase.from("execution_events").insert({
        execution_id: created.id,
        event_type: "created",
        payload: { prompt: data.prompt, blenderVersion: data.blenderVersion },
      });

      return {
        id: created.id,
        generationId: created.generation_id,
        projectId: created.project_id,
        userId: created.user_id,
        status: created.status,
        script: created.script,
        prompt: created.prompt,
        blenderVersion: created.blender_version,
        stdout: created.stdout || "",
        stderr: created.stderr || "",
        durationMs: created.duration_ms,
        createdAt: created.created_at,
        claimedAt: created.claimed_at,
        startedAt: created.started_at,
        completedAt: created.completed_at,
      };
    } catch {
      return fallbackStore.createExecution(data);
    }
  },

  async getExecutions(userId: string, filter?: { status?: string; projectId?: string }): Promise<DBExecution[]> {
    if (!isSupabaseConfigured()) return fallbackStore.getExecutions(userId, filter);

    try {
      const supabase = createAdminClient();
      let query = supabase.from("executions").select("*").eq("user_id", userId);
      if (filter?.status) query = query.eq("status", filter.status);
      if (filter?.projectId) query = query.eq("project_id", filter.projectId);
      query = query.order("created_at", { ascending: false }).limit(50);

      const { data, error } = await query;
      if (error || !data) return fallbackStore.getExecutions(userId, filter);

      return data.map((row: any) => ({
        id: row.id,
        generationId: row.generation_id,
        projectId: row.project_id,
        userId: row.user_id,
        status: row.status,
        script: row.script || "",
        prompt: row.prompt || "",
        blenderVersion: row.blender_version,
        stdout: row.stdout || "",
        stderr: row.stderr || "",
        durationMs: row.duration_ms,
        createdAt: row.created_at,
        claimedAt: row.claimed_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
      }));
    } catch {
      return fallbackStore.getExecutions(userId, filter);
    }
  },

  async getExecutionById(executionId: string, userId: string): Promise<DBExecution | null> {
    if (!isSupabaseConfigured()) return fallbackStore.getExecutionById(executionId, userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("executions")
        .select("*")
        .eq("id", executionId)
        .eq("user_id", userId)
        .single();

      if (error || !data) return fallbackStore.getExecutionById(executionId, userId);

      return {
        id: data.id,
        generationId: data.generation_id,
        projectId: data.project_id,
        userId: data.user_id,
        status: data.status,
        script: data.script || "",
        prompt: data.prompt || "",
        blenderVersion: data.blender_version,
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        durationMs: data.duration_ms,
        createdAt: data.created_at,
        claimedAt: data.claimed_at,
        startedAt: data.started_at,
        completedAt: data.completed_at,
      };
    } catch {
      return fallbackStore.getExecutionById(executionId, userId);
    }
  },

  // Atomic Claim of Next Pending Task
  async claimNextExecution(userId: string, blenderVersion: string = "4.x"): Promise<DBExecution | null> {
    if (!isSupabaseConfigured()) return fallbackStore.claimNextExecution(userId, blenderVersion);

    try {
      const supabase = createAdminClient();
      // Try atomic stored procedure first
      const { data, error } = await supabase.rpc("claim_next_execution_task", {
        p_user_id: userId,
        p_blender_version: blenderVersion,
      });

      if (!error && data && data.length > 0) {
        const row = data[0];
        return {
          id: row.id,
          generationId: row.generation_id,
          projectId: row.project_id,
          userId: row.user_id,
          status: row.status,
          script: row.script || "",
          prompt: row.prompt || "",
          blenderVersion: row.blender_version,
          stdout: row.stdout || "",
          stderr: row.stderr || "",
          durationMs: row.duration_ms,
          createdAt: row.created_at,
          claimedAt: row.claimed_at,
          startedAt: row.started_at,
          completedAt: row.completed_at,
        };
      }

      // If stored procedure doesn't exist yet, do atomic update
      const { data: pending } = await supabase
        .from("executions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!pending) return null;

      const now = new Date().toISOString();
      const { data: claimed, error: claimErr } = await supabase
        .from("executions")
        .update({ status: "claimed", claimed_at: now })
        .eq("id", pending.id)
        .eq("status", "pending")
        .select()
        .single();

      if (claimErr || !claimed) return null;

      return {
        id: claimed.id,
        generationId: claimed.generation_id,
        projectId: claimed.project_id,
        userId: claimed.user_id,
        status: claimed.status,
        script: claimed.script || "",
        prompt: claimed.prompt || "",
        blenderVersion: claimed.blender_version,
        stdout: claimed.stdout || "",
        stderr: claimed.stderr || "",
        durationMs: claimed.duration_ms,
        createdAt: claimed.created_at,
        claimedAt: claimed.claimed_at,
        startedAt: claimed.started_at,
        completedAt: claimed.completed_at,
      };
    } catch {
      return fallbackStore.claimNextExecution(userId, blenderVersion);
    }
  },

  // Atomic Claim of Specific Execution Task
  async claimExecutionById(executionId: string, userId: string, blenderVersion: string = "4.x"): Promise<DBExecution | null> {
    if (!isSupabaseConfigured()) return fallbackStore.claimExecutionById(executionId, userId, blenderVersion);

    try {
      const supabase = createAdminClient();
      const now = new Date().toISOString();
      const { data: claimed, error } = await supabase
        .from("executions")
        .update({ status: "claimed", claimed_at: now })
        .eq("id", executionId)
        .eq("user_id", userId)
        .eq("status", "pending")
        .select()
        .single();

      if (error || !claimed) return fallbackStore.claimExecutionById(executionId, userId, blenderVersion);

      await supabase.from("execution_events").insert({
        execution_id: claimed.id,
        event_type: "claimed",
        payload: { claimedAt: now, blenderVersion },
      });

      return {
        id: claimed.id,
        generationId: claimed.generation_id,
        projectId: claimed.project_id,
        userId: claimed.user_id,
        status: claimed.status,
        script: claimed.script || "",
        prompt: claimed.prompt || "",
        blenderVersion: claimed.blender_version,
        stdout: claimed.stdout || "",
        stderr: claimed.stderr || "",
        durationMs: claimed.duration_ms,
        createdAt: claimed.created_at,
        claimedAt: claimed.claimed_at,
        startedAt: claimed.started_at,
        completedAt: claimed.completed_at,
      };
    } catch {
      return fallbackStore.claimExecutionById(executionId, userId, blenderVersion);
    }
  },

  async startExecution(executionId: string, userId: string): Promise<DBExecution | null> {
    if (!isSupabaseConfigured()) return fallbackStore.startExecution(executionId, userId);

    try {
      const supabase = createAdminClient();
      const now = new Date().toISOString();
      const { data: updated, error } = await supabase
        .from("executions")
        .update({ status: "running", started_at: now })
        .eq("id", executionId)
        .eq("user_id", userId)
        .in("status", ["pending", "claimed"])
        .select()
        .single();

      if (error || !updated) return fallbackStore.startExecution(executionId, userId);

      await supabase.from("execution_events").insert({
        execution_id: updated.id,
        event_type: "started",
        payload: { startedAt: now },
      });

      return {
        id: updated.id,
        generationId: updated.generation_id,
        projectId: updated.project_id,
        userId: updated.user_id,
        status: updated.status,
        script: updated.script || "",
        prompt: updated.prompt || "",
        blenderVersion: updated.blender_version,
        stdout: updated.stdout || "",
        stderr: updated.stderr || "",
        durationMs: updated.duration_ms,
        createdAt: updated.created_at,
        claimedAt: updated.claimed_at,
        startedAt: updated.started_at,
        completedAt: updated.completed_at,
      };
    } catch {
      return fallbackStore.startExecution(executionId, userId);
    }
  },

  async completeExecution(
    executionId: string,
    userId: string,
    data: {
      status: "success" | "error";
      stdout?: string;
      stderr?: string;
      durationMs?: number | null;
      blenderVersion?: string;
    }
  ): Promise<DBExecution | null> {
    if (!isSupabaseConfigured()) return fallbackStore.completeExecution(executionId, userId, data);

    try {
      const supabase = createAdminClient();
      const now = new Date().toISOString();
      const updates: any = {
        status: data.status,
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        duration_ms: data.durationMs ?? null,
        completed_at: now,
      };
      if (data.blenderVersion) updates.blender_version = data.blenderVersion;

      const { data: updated, error } = await supabase
        .from("executions")
        .update(updates)
        .eq("id", executionId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error || !updated) return fallbackStore.completeExecution(executionId, userId, data);

      await supabase.from("execution_events").insert({
        execution_id: updated.id,
        event_type: "completed",
        payload: {
          status: data.status,
          durationMs: data.durationMs,
          completedAt: now,
        },
      });

      return {
        id: updated.id,
        generationId: updated.generation_id,
        projectId: updated.project_id,
        userId: updated.user_id,
        status: updated.status,
        script: updated.script || "",
        prompt: updated.prompt || "",
        blenderVersion: updated.blender_version,
        stdout: updated.stdout || "",
        stderr: updated.stderr || "",
        durationMs: updated.duration_ms,
        createdAt: updated.created_at,
        claimedAt: updated.claimed_at,
        startedAt: updated.started_at,
        completedAt: updated.completed_at,
      };
    } catch {
      return fallbackStore.completeExecution(executionId, userId, data);
    }
  },

  async cancelExecution(executionId: string, userId: string): Promise<DBExecution | null> {
    if (!isSupabaseConfigured()) return fallbackStore.cancelExecution(executionId, userId);

    try {
      const supabase = createAdminClient();
      const now = new Date().toISOString();
      const { data: updated, error } = await supabase
        .from("executions")
        .update({ status: "cancelled", completed_at: now })
        .eq("id", executionId)
        .eq("user_id", userId)
        .in("status", ["pending", "claimed", "running"])
        .select()
        .single();

      if (error || !updated) return fallbackStore.cancelExecution(executionId, userId);

      await supabase.from("execution_events").insert({
        execution_id: updated.id,
        event_type: "cancelled",
        payload: { cancelledAt: now },
      });

      return {
        id: updated.id,
        generationId: updated.generation_id,
        projectId: updated.project_id,
        userId: updated.user_id,
        status: updated.status,
        script: updated.script || "",
        prompt: updated.prompt || "",
        blenderVersion: updated.blender_version,
        stdout: updated.stdout || "",
        stderr: updated.stderr || "",
        durationMs: updated.duration_ms,
        createdAt: updated.created_at,
        claimedAt: updated.claimed_at,
        startedAt: updated.started_at,
        completedAt: updated.completed_at,
      };
    } catch {
      return fallbackStore.cancelExecution(executionId, userId);
    }
  },

  // Dashboard Stats
  async getDashboardStats(userId: string) {
    if (!isSupabaseConfigured()) return fallbackStore.getDashboardStats(userId);

    try {
      const supabase = createAdminClient();

      const [projectsRes, generationsRes, executionsRes] = await Promise.all([
        supabase.from("projects").select("id, name, updated_at").eq("user_id", userId),
        supabase.from("generations").select("id, project_id, prompt, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("executions").select("id, status").eq("user_id", userId),
      ]);

      const projects = projectsRes.data || [];
      const generations = generationsRes.data || [];
      const executions = executionsRes.data || [];

      const successExecs = executions.filter((e) => e.status === "success").length;
      const errorExecs = executions.filter((e) => e.status === "error").length;

      const recentGenerations = generations.slice(0, 5).map((g) => {
        const proj = projects.find((p) => p.id === g.project_id);
        return {
          id: g.id,
          title: g.prompt,
          projectName: proj?.name || "Blender Project",
          status: "Completed",
          createdAt: g.created_at,
        };
      });

      return {
        totalProjects: projects.length,
        totalGenerations: generations.length,
        successfulExecutions: successExecs,
        failedExecutions: errorExecs,
        recentGenerations,
      };
    } catch {
      return fallbackStore.getDashboardStats(userId);
    }
  },

  // Blender Devices & Heartbeat
  async recordBlenderHeartbeat(data: {
    userId: string;
    deviceId: string;
    deviceName?: string;
    blenderVersion?: string;
    addonVersion?: string;
    status: string;
    currentProjectId?: string;
    currentExecutionId?: string;
  }): Promise<DBBlenderDevice> {
    if (!isSupabaseConfigured()) return fallbackStore.recordHeartbeat(data);

    try {
      const supabase = createAdminClient();
      const now = new Date().toISOString();
      const { data: upserted, error } = await supabase
        .from("blender_devices")
        .upsert(
          {
            user_id: data.userId,
            device_id: data.deviceId,
            device_name: data.deviceName || "Blender Workstation",
            blender_version: data.blenderVersion || "4.x",
            addon_version: data.addonVersion || "1.1.0",
            status: data.status || "IDLE",
            current_project_id: data.currentProjectId || null,
            current_execution_id: data.currentExecutionId || null,
            last_seen: now,
          },
          { onConflict: "user_id,device_id" }
        )
        .select()
        .single();

      if (error || !upserted) return fallbackStore.recordHeartbeat(data);

      return {
        id: upserted.id,
        userId: upserted.user_id,
        deviceId: upserted.device_id,
        deviceName: upserted.device_name,
        blenderVersion: upserted.blender_version,
        addonVersion: upserted.addon_version,
        status: upserted.status,
        currentProjectId: upserted.current_project_id,
        currentExecutionId: upserted.current_execution_id,
        lastSeen: upserted.last_seen,
        createdAt: upserted.created_at,
      };
    } catch {
      return fallbackStore.recordHeartbeat(data);
    }
  },

  async getBlenderDeviceStatus(userId: string): Promise<{
    status: "CONNECTED" | "IDLE" | "BUSY" | "EXECUTING" | "ERROR" | "OFFLINE";
    device: DBBlenderDevice | null;
  }> {
    if (!isSupabaseConfigured()) return fallbackStore.getDeviceStatus(userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("blender_devices")
        .select("*")
        .eq("user_id", userId)
        .order("last_seen", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return fallbackStore.getDeviceStatus(userId);

      const diffMs = Date.now() - new Date(data.last_seen).getTime();
      const status = diffMs > 45000 ? "OFFLINE" : data.status;

      const device: DBBlenderDevice = {
        id: data.id,
        userId: data.user_id,
        deviceId: data.device_id,
        deviceName: data.device_name,
        blenderVersion: data.blender_version,
        addonVersion: data.addon_version,
        status,
        currentProjectId: data.current_project_id,
        currentExecutionId: data.current_execution_id,
        lastSeen: data.last_seen,
        createdAt: data.created_at,
      };

      return { status, device };
    } catch {
      return fallbackStore.getDeviceStatus(userId);
    }
  },

  // Scene Snapshots
  async saveSceneSnapshot(data: {
    userId: string;
    projectId: string;
    sceneName?: string;
    blenderVersion?: string;
    snapshot: any;
  }): Promise<DBSceneSnapshot> {
    if (!isSupabaseConfigured()) return fallbackStore.saveSnapshot(data);

    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase
        .from("scene_snapshots")
        .insert({
          user_id: data.userId,
          project_id: data.projectId,
          scene_name: data.sceneName || "Scene",
          blender_version: data.blenderVersion || "4.x",
          snapshot_json: data.snapshot,
        })
        .select()
        .single();

      if (error || !created) return fallbackStore.saveSnapshot(data);

      return {
        id: created.id,
        projectId: created.project_id,
        userId: created.user_id,
        sceneName: created.scene_name,
        blenderVersion: created.blender_version,
        snapshotJson: created.snapshot_json,
        createdAt: created.created_at,
      };
    } catch {
      return fallbackStore.saveSnapshot(data);
    }
  },

  async getLatestSceneSnapshot(projectId: string, userId: string): Promise<DBSceneSnapshot | null> {
    if (!isSupabaseConfigured()) return fallbackStore.getLatestSnapshot(projectId, userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("scene_snapshots")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return fallbackStore.getLatestSnapshot(projectId, userId);

      return {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        sceneName: data.scene_name,
        blenderVersion: data.blender_version,
        snapshotJson: data.snapshot_json,
        createdAt: data.created_at,
      };
    } catch {
      return fallbackStore.getLatestSnapshot(projectId, userId);
    }
  },

  // Generation Versions
  async saveGenerationVersion(data: {
    userId: string;
    projectId: string;
    generationId?: string;
    versionNumber: number;
    prompt: string;
    code: string;
    planJson: any;
    parentVersionId?: string;
    glbUrl?: string;
    snapshotJson?: any;
  }): Promise<DBGenerationVersion> {
    if (!isSupabaseConfigured()) return fallbackStore.saveVersion(data);

    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase
        .from("generation_versions")
        .insert({
          user_id: data.userId,
          project_id: data.projectId,
          generation_id: data.generationId || null,
          version_number: data.versionNumber,
          prompt: data.prompt,
          code: data.code,
          plan_json: data.planJson,
          parent_version_id: data.parentVersionId || null,
          glb_url: data.glbUrl || null,
          snapshot_json: data.snapshotJson || null,
        })
        .select()
        .single();

      if (error || !created) return fallbackStore.saveVersion(data);

      return {
        id: created.id,
        projectId: created.project_id,
        generationId: created.generation_id,
        userId: created.user_id,
        versionNumber: created.version_number,
        prompt: created.prompt,
        code: created.code,
        planJson: created.plan_json,
        parentVersionId: created.parent_version_id,
        glbUrl: created.glb_url,
        snapshotJson: created.snapshot_json,
        createdAt: created.created_at,
      };
    } catch {
      return fallbackStore.saveVersion(data);
    }
  },

  async getGenerationVersions(projectId: string, userId: string): Promise<DBGenerationVersion[]> {
    if (!isSupabaseConfigured()) return fallbackStore.getVersions(projectId, userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("generation_versions")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .order("version_number", { ascending: false });

      if (error || !data) return fallbackStore.getVersions(projectId, userId);

      return data.map((v: any) => ({
        id: v.id,
        projectId: v.project_id,
        generationId: v.generation_id,
        userId: v.user_id,
        versionNumber: v.version_number,
        prompt: v.prompt,
        code: v.code,
        planJson: v.plan_json,
        parentVersionId: v.parent_version_id,
        glbUrl: v.glb_url,
        snapshotJson: v.snapshot_json,
        createdAt: v.created_at,
      }));
    } catch {
      return fallbackStore.getVersions(projectId, userId);
    }
  },

  // Templates
  async getTemplates(category?: string): Promise<DBTemplate[]> {
    if (!isSupabaseConfigured()) return fallbackStore.getTemplates(category);

    try {
      const supabase = createAdminClient();
      let query = supabase.from("templates").select("*");
      if (category && category !== "All") {
        query = query.ilike("category", category);
      }
      const { data, error } = await query.order("title", { ascending: true });

      if (error || !data || data.length === 0) return fallbackStore.getTemplates(category);

      return data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        difficulty: t.difficulty,
        tags: t.tags || [],
        thumbnailUrl: t.thumbnail_url,
        startingPrompt: t.starting_prompt,
        starterCode: t.starter_code,
        starterPlan: t.starter_plan,
        isOfficial: t.is_official,
        createdAt: t.created_at,
      }));
    } catch {
      return fallbackStore.getTemplates(category);
    }
  },

  // AI Usage
  async trackAiUsage(data: {
    userId: string;
    projectId?: string;
    model: string;
    operationType: string;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  }): Promise<DBAiUsage> {
    if (!isSupabaseConfigured()) return fallbackStore.trackAiUsage(data);

    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase
        .from("ai_usage")
        .insert({
          user_id: data.userId,
          project_id: data.projectId || null,
          model: data.model,
          operation_type: data.operationType,
          prompt_tokens: data.promptTokens,
          completion_tokens: data.completionTokens,
          estimated_cost_usd: data.estimatedCostUsd,
        })
        .select()
        .single();

      if (error || !created) return fallbackStore.trackAiUsage(data);

      return {
        id: created.id,
        userId: created.user_id,
        projectId: created.project_id,
        model: created.model,
        operationType: created.operation_type,
        promptTokens: created.prompt_tokens,
        completionTokens: created.completion_tokens,
        estimatedCostUsd: created.estimated_cost_usd,
        createdAt: created.created_at,
      };
    } catch {
      return fallbackStore.trackAiUsage(data);
    }
  },

  async getAiUsageSummary(userId: string) {
    if (!isSupabaseConfigured()) return fallbackStore.getAiUsageSummary(userId);

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("ai_usage")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error || !data) return fallbackStore.getAiUsageSummary(userId);

      const totalPromptTokens = data.reduce((acc, u) => acc + (u.prompt_tokens || 0), 0);
      const totalCompletionTokens = data.reduce((acc, u) => acc + (u.completion_tokens || 0), 0);
      const totalCostUsd = data.reduce((acc, u) => acc + Number(u.estimated_cost_usd || 0), 0);

      return {
        totalGenerations: data.filter((u) => u.operation_type === "generation").length,
        totalImageAnalyses: data.filter((u) => u.operation_type === "vision").length,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        totalCostUsd: Number(totalCostUsd.toFixed(4)),
        events: data.slice(0, 20),
      };
    } catch {
      return fallbackStore.getAiUsageSummary(userId);
    }
  },
};

