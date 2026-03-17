import Foundation
import Supabase

final class SupabaseManager {
    static let shared = SupabaseManager()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: Config.supabaseURL,
            supabaseKey: Config.supabaseAnonKey,
            options: .init(
                auth: .init(
                    redirectToURL: URL(string: "vocafast://callback"),
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }
}
