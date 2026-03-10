import SwiftUI

struct EditWordSheet: View {
    let word: Word
    let onSave: (String, String, String?) -> Void
    let onDelete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var editWord: String
    @State private var editTranslation: String
    @State private var editContext: String

    init(word: Word, onSave: @escaping (String, String, String?) -> Void, onDelete: @escaping () -> Void) {
        self.word = word
        self.onSave = onSave
        self.onDelete = onDelete
        _editWord = State(initialValue: word.word)
        _editTranslation = State(initialValue: word.translation)
        _editContext = State(initialValue: word.contextSentence ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Word") {
                    TextField("Word", text: $editWord)
                }

                Section("Translation") {
                    TextField("Translation", text: $editTranslation)
                }

                Section("Context Sentence (optional)") {
                    TextField("Context sentence", text: $editContext)
                }

                Section {
                    Button("Delete Word", role: .destructive) {
                        onDelete()
                        dismiss()
                    }
                }
            }
            .navigationTitle("Edit Word")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave(editWord, editTranslation, editContext.isEmpty ? nil : editContext)
                        dismiss()
                    }
                    .disabled(editWord.isEmpty || editTranslation.isEmpty)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
