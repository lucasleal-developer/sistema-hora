import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Calendar, Clock, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">
            Bem-vindo ao Sistema de Gerenciamento de Escalas
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl text-center mb-8">
            Organize, gerencie e visualize facilmente as escalas de horários dos profissionais.
            Um sistema completo para garantir eficiência na distribuição de atividades.
          </p>
          
          <Link href="/schedule">
            <Button size="lg" className="mb-12">
              <Calendar className="mr-2 h-5 w-5" />
              Visualizar Escalas
            </Button>
          </Link>
          
          <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gerenciamento de Dias</h3>
              <p className="text-gray-600">
                Organize as escalas por dias da semana, visualizando e editando facilmente cada período.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Equipe Organizada</h3>
              <p className="text-gray-600">
                Visualize todos os profissionais na mesma tela, facilitando a distribuição equilibrada de atividades.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Horários Dinâmicos</h3>
              <p className="text-gray-600">
                Edite e ajuste os horários de forma intuitiva, atribuindo diferentes atividades para cada profissional.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
