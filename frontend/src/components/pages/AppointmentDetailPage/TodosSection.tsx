import { Pill, FlaskConical, Stethoscope, ClipboardList, Calendar, Clock, Timer, Hourglass } from "lucide-react";
import { ReadMore } from "@/components/shared/ReadMore";

interface Todo {
  type: string;
  title: string;
  description: string;
  recommended: boolean;
  verified: boolean;
  // Medication specific
  dosage?: string;
  frequency?: string;
  timing?: string;
  duration?: string;
  // Procedure specific
  timeframe?: string;
}

interface TodosSectionProps {
  todos: Todo[];
}

function getTodoIcon(type: string) {
  const lowerType = type.toLowerCase();
  
  if (lowerType === "medication") {
    return <Pill className="w-5 h-5 text-blue-600" />;
  } else if (lowerType === "tests" || lowerType === "test") {
    return <FlaskConical className="w-5 h-5 text-green-600" />;
  } else if (lowerType === "procedure") {
    return <Stethoscope className="w-5 h-5 text-purple-600" />;
  } else {
    return <ClipboardList className="w-5 h-5 text-orange-600" />;
  }
}

function getTodoColor(type: string) {
  const lowerType = type.toLowerCase();
  
  if (lowerType === "medication") {
    return "border-blue-500";
  } else if (lowerType === "tests" || lowerType === "test") {
    return "border-green-500";
  } else if (lowerType === "procedure") {
    return "border-purple-500";
  } else {
    return "border-orange-500";
  }
}

export function TodosSection({ todos }: TodosSectionProps) {
  if (!todos || todos.length === 0) return null;

  const todoItems = todos.map((todo, index) => (
    <div key={index} className={`border-l-4 ${getTodoColor(todo.type)} pl-4 py-2 bg-gray-50 rounded-r-lg`}>
      <div className="flex items-start gap-3 mb-2">
        {getTodoIcon(todo.type)}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{todo.title}</h3>
            {todo.verified && (
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                Verified
              </span>
            )}
          </div>
          
          {todo.description && (
            <p className="text-base text-gray-600 mt-1">{todo.description}</p>
          )}
        </div>
      </div>
      {/* Medication specific details */}
      {todo.type.toLowerCase() === "medication" && (todo.dosage || todo.frequency || todo.timing || todo.duration) && (
        <div className="flex flex-wrap gap-2 mt-2 text-base text-gray-700">
          {todo.dosage && <span>💊 {todo.dosage}</span>}
          {todo.frequency && <span>⏱️ {todo.frequency}</span>}
          {todo.timing && <span>🕐 {todo.timing}</span>}
          {todo.duration && <span>📅 {todo.duration}</span>}
        </div>
      )}
      
      {/* Procedure specific details */}
      {todo.type.toLowerCase() === "procedure" && todo.timeframe && (
        <div className="flex flex-wrap gap-4 mt-2 text-base text-gray-700">
          <span>📅 {todo.timeframe}</span>
        </div>
      )}
    </div>
  ));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Action Items</h2>
      <ReadMore items={todoItems} initialCount={5} />
    </div>
  );
}
