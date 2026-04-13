import { ToolModule } from './interface.js';

interface CircuitComponent {
  id: string;
  type: 'resistor' | 'capacitor' | 'inductor' | 'diode' | 'transistor' | 'voltage_source' | 'current_source';
  value?: string;
  unit?: string;
  x: number;
  y: number;
  rotation?: number;
}

interface CircuitConnection {
  fromId: string;
  toId: string;
  label?: string;
}

interface Circuit {
  name: string;
  components: CircuitComponent[];
  connections: CircuitConnection[];
  description?: string;
}

const circuitDatabase: Map<string, Circuit> = new Map();

function validateComponent(component: CircuitComponent): string | null {
  if (!component.id || !component.type) {
    return 'Component must have id and type';
  }
  if (!['resistor', 'capacitor', 'inductor', 'diode', 'transistor', 'voltage_source', 'current_source'].includes(component.type)) {
    return 'Invalid component type';
  }
  if (component.x === undefined || component.y === undefined) {
    return 'Component must have x and y coordinates';
  }
  return null;
}

function generateNetlist(circuit: Circuit): string {
  let netlist = `* ${circuit.name}\n`;
  netlist += `* ${circuit.description || 'Circuit netlist'}\n\n`;

  // Add components
  for (const component of circuit.components) {
    const value = component.value ? ` ${component.value}` : '';
    const unit = component.unit ? component.unit : '';
    
    switch (component.type) {
      case 'resistor':
        netlist += `R_${component.id} node1 node2 ${value}${unit}\n`;
        break;
      case 'capacitor':
        netlist += `C_${component.id} node1 node2 ${value}${unit}\n`;
        break;
      case 'inductor':
        netlist += `L_${component.id} node1 node2 ${value}${unit}\n`;
        break;
      case 'diode':
        netlist += `D_${component.id} node1 node2 1N4148\n`;
        break;
      case 'transistor':
        netlist += `Q_${component.id} collector base emitter Q2N3904\n`;
        break;
      case 'voltage_source':
        netlist += `V_${component.id} node1 0 ${value}${unit}\n`;
        break;
      case 'current_source':
        netlist += `I_${component.id} node1 0 ${value}${unit}\n`;
        break;
    }
  }

  netlist += '\n.end\n';
  return netlist;
}

function generateSVGDiagram(circuit: Circuit): string {
  const width = 800;
  const height = 600;
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += `  <defs>\n`;
  svg += `    <style>\n`;
  svg += `      .component-text { font-size: 12px; fill: #000; }\n`;
  svg += `      .component-circle { fill: none; stroke: #333; stroke-width: 2; }\n`;
  svg += `      .connection { stroke: #000; stroke-width: 2; fill: none; }\n`;
  svg += `    </style>\n`;
  svg += `  </defs>\n`;
  
  // Background
  svg += `  <rect width="${width}" height="${height}" fill="#fff" stroke="#000" stroke-width="1"/>\n`;
  
  // Draw components
  for (const component of circuit.components) {
    const x = component.x;
    const y = component.y;
    
    switch (component.type) {
      case 'resistor':
        svg += `  <!-- Resistor: ${component.id} -->\n`;
        svg += `  <rect x="${x-15}" y="${y-8}" width="30" height="16" class="component-circle" fill="none" stroke="#333" stroke-width="2"/>\n`;
        svg += `  <text x="${x}" y="${y+20}" class="component-text" text-anchor="middle">${component.id}</text>\n`;
        break;
      case 'capacitor':
        svg += `  <!-- Capacitor: ${component.id} -->\n`;
        svg += `  <line x1="${x-20}" y1="${y}" x2="${x-8}" y2="${y}" stroke="#333" stroke-width="2"/>\n`;
        svg += `  <line x1="${x-8}" y1="${y-10}" x2="${x-8}" y2="${y+10}" stroke="#333" stroke-width="2"/>\n`;
        svg += `  <line x1="${x+8}" y1="${y-10}" x2="${x+8}" y2="${y+10}" stroke="#333" stroke-width="2"/>\n`;
        svg += `  <line x1="${x+8}" y1="${y}" x2="${x+20}" y2="${y}" stroke="#333" stroke-width="2"/>\n`;
        svg += `  <text x="${x}" y="${y+20}" class="component-text" text-anchor="middle">${component.id}</text>\n`;
        break;
      case 'diode':
        svg += `  <!-- Diode: ${component.id} -->\n`;
        svg += `  <polygon points="${x-10},${y-8} ${x-10},${y+8} ${x+10},${y}" class="component-circle" fill="none" stroke="#333" stroke-width="2"/>\n`;
        svg += `  <line x1="${x+10}" y1="${y-8}" x2="${x+10}" y2="${y+8}" stroke="#333" stroke-width="2"/>\n`;
        svg += `  <text x="${x}" y="${y+20}" class="component-text" text-anchor="middle">${component.id}</text>\n`;
        break;
      case 'voltage_source':
        svg += `  <!-- Voltage Source: ${component.id} -->\n`;
        svg += `  <circle cx="${x}" cy="${y}" r="12" class="component-circle"/>\n`;
        svg += `  <text x="${x}" y="${y+4}" class="component-text" text-anchor="middle" font-weight="bold">V</text>\n`;
        svg += `  <text x="${x}" y="${y+20}" class="component-text" text-anchor="middle">${component.id}</text>\n`;
        break;
      case 'transistor':
        svg += `  <!-- Transistor: ${component.id} -->\n`;
        svg += `  <circle cx="${x}" cy="${y}" r="12" class="component-circle"/>\n`;
        svg += `  <text x="${x}" y="${y+4}" class="component-text" text-anchor="middle" font-weight="bold">Q</text>\n`;
        svg += `  <text x="${x}" y="${y+20}" class="component-text" text-anchor="middle">${component.id}</text>\n`;
        break;
    }
  }
  
  // Draw connections
  for (const connection of circuit.connections) {
    const fromComp = circuit.components.find(c => c.id === connection.fromId);
    const toComp = circuit.components.find(c => c.id === connection.toId);
    
    if (fromComp && toComp) {
      svg += `  <line x1="${fromComp.x}" y1="${fromComp.y}" x2="${toComp.x}" y2="${toComp.y}" class="connection"/>\n`;
      if (connection.label) {
        const midX = (fromComp.x + toComp.x) / 2;
        const midY = (fromComp.y + toComp.y) / 2;
        svg += `  <text x="${midX}" y="${midY-5}" class="component-text" text-anchor="middle" fill="#0066cc">${connection.label}</text>\n`;
      }
    }
  }
  
  svg += `</svg>\n`;
  return svg;
}

export const CircuitDesignTool: ToolModule = {
  name: "Circuit Design",
  definition: {
    type: "function",
    function: {
      name: "circuit_design",
      description: "Design, analyze, and simulate electronic circuits. Create components, connect them, validate topology, and generate netlists or diagrams.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["create_circuit", "add_component", "add_connection", "validate", "generate_netlist", "generate_diagram", "list_circuits", "get_circuit", "analyze"],
            description: "The circuit design action to perform"
          },
          circuit_name: {
            type: "string",
            description: "Name of the circuit"
          },
          circuit_description: {
            type: "string",
            description: "Description of the circuit"
          },
          component: {
            type: "object",
            description: "Component to add (id, type, value, unit, x, y)",
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: ["resistor", "capacitor", "inductor", "diode", "transistor", "voltage_source", "current_source"] },
              value: { type: "string" },
              unit: { type: "string" },
              x: { type: "number" },
              y: { type: "number" }
            }
          },
          from_component: {
            type: "string",
            description: "ID of the first component to connect"
          },
          to_component: {
            type: "string",
            description: "ID of the second component to connect"
          },
          connection_label: {
            type: "string",
            description: "Label for the connection (e.g., node name)"
          }
        },
        required: ["action"]
      }
    }
  },
  handler: async (args: any) => {
    const action = args.action;

    switch (action) {
      case "create_circuit": {
        if (!args.circuit_name) {
          return "Error: circuit_name is required";
        }
        const circuit: Circuit = {
          name: args.circuit_name,
          description: args.circuit_description || "",
          components: [],
          connections: []
        };
        circuitDatabase.set(args.circuit_name, circuit);
        return `Circuit "${args.circuit_name}" created successfully.`;
      }

      case "add_component": {
        if (!args.circuit_name || !args.component) {
          return "Error: circuit_name and component are required";
        }
        const circuit = circuitDatabase.get(args.circuit_name);
        if (!circuit) {
          return `Error: Circuit "${args.circuit_name}" not found`;
        }

        const validationError = validateComponent(args.component);
        if (validationError) {
          return `Error: ${validationError}`;
        }

        circuit.components.push(args.component);
        return `Component "${args.component.id}" (${args.component.type}) added successfully.`;
      }

      case "add_connection": {
        if (!args.circuit_name || !args.from_component || !args.to_component) {
          return "Error: circuit_name, from_component, and to_component are required";
        }
        const circuit = circuitDatabase.get(args.circuit_name);
        if (!circuit) {
          return `Error: Circuit "${args.circuit_name}" not found`;
        }

        const fromExists = circuit.components.some(c => c.id === args.from_component);
        const toExists = circuit.components.some(c => c.id === args.to_component);

        if (!fromExists || !toExists) {
          return "Error: One or both components not found";
        }

        circuit.connections.push({
          fromId: args.from_component,
          toId: args.to_component,
          label: args.connection_label
        });
        return `Connection created: ${args.from_component} → ${args.to_component}`;
      }

      case "validate": {
        if (!args.circuit_name) {
          return "Error: circuit_name is required";
        }
        const circuit = circuitDatabase.get(args.circuit_name);
        if (!circuit) {
          return `Error: Circuit "${args.circuit_name}" not found`;
        }

        const issues: string[] = [];
        
        if (circuit.components.length === 0) {
          issues.push("Warning: Circuit has no components");
        }
        
        const connectedIds = new Set<string>();
        for (const conn of circuit.connections) {
          connectedIds.add(conn.fromId);
          connectedIds.add(conn.toId);
        }
        
        const unconnectedComponents = circuit.components
          .filter(c => !connectedIds.has(c.id))
          .map(c => c.id);
        
        if (unconnectedComponents.length > 0) {
          issues.push(`Warning: Unconnected components: ${unconnectedComponents.join(", ")}`);
        }

        if (issues.length === 0) {
          return `✓ Circuit "${args.circuit_name}" is valid. Components: ${circuit.components.length}, Connections: ${circuit.connections.length}`;
        } else {
          return `Circuit validation issues:\n${issues.join("\n")}`;
        }
      }

      case "generate_netlist": {
        if (!args.circuit_name) {
          return "Error: circuit_name is required";
        }
        const circuit = circuitDatabase.get(args.circuit_name);
        if (!circuit) {
          return `Error: Circuit "${args.circuit_name}" not found`;
        }

        return generateNetlist(circuit);
      }

      case "generate_diagram": {
        if (!args.circuit_name) {
          return "Error: circuit_name is required";
        }
        const circuit = circuitDatabase.get(args.circuit_name);
        if (!circuit) {
          return `Error: Circuit "${args.circuit_name}" not found`;
        }

        return generateSVGDiagram(circuit);
      }

      case "list_circuits": {
        const circuits = Array.from(circuitDatabase.keys());
        if (circuits.length === 0) {
          return "No circuits created yet.";
        }
        return `Available circuits:\n${circuits.map(name => `- ${name}`).join("\n")}`;
      }

      case "get_circuit": {
        if (!args.circuit_name) {
          return "Error: circuit_name is required";
        }
        const circuit = circuitDatabase.get(args.circuit_name);
        if (!circuit) {
          return `Error: Circuit "${args.circuit_name}" not found`;
        }

        return JSON.stringify(circuit, null, 2);
      }

      case "analyze": {
        if (!args.circuit_name) {
          return "Error: circuit_name is required";
        }
        const circuit = circuitDatabase.get(args.circuit_name);
        if (!circuit) {
          return `Error: Circuit "${args.circuit_name}" not found`;
        }

        const analysis = {
          name: circuit.name,
          description: circuit.description,
          total_components: circuit.components.length,
          component_breakdown: {} as Record<string, number>,
          total_connections: circuit.connections.length,
          component_details: circuit.components.map(c => ({
            id: c.id,
            type: c.type,
            value: c.value || "N/A",
            unit: c.unit || ""
          }))
        };

        for (const comp of circuit.components) {
          analysis.component_breakdown[comp.type] = (analysis.component_breakdown[comp.type] || 0) + 1;
        }

        return JSON.stringify(analysis, null, 2);
      }

      default:
        return `Error: Unknown action "${action}"`;
    }
  }
};
