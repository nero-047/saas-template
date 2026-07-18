import nx from "@nx/eslint-plugin";

export default [
    ...nx.configs["flat/base"],
    ...nx.configs["flat/typescript"],
    ...nx.configs["flat/javascript"],
    {
        ignores: [
            "**/dist",
            "**/out-tsc"
        ]
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        rules: {
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    allow: [
                        "^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$"
                    ],
                    depConstraints: [
                        {
                            sourceTag: "type:app",
                            onlyDependOnLibsWithTags: [
                                "type:shared",
                                "type:validation",
                                "type:api-client",
                                "type:ui"
                            ]
                        },
                        {
                            sourceTag: "type:api-client",
                            onlyDependOnLibsWithTags: [
                                "type:shared",
                                "type:validation",
                                "type:api-client"
                            ]
                        },
                        {
                            sourceTag: "type:ui",
                            onlyDependOnLibsWithTags: [
                                "type:shared",
                                "type:validation",
                                "type:ui"
                            ]
                        },
                        {
                            sourceTag: "type:validation",
                            onlyDependOnLibsWithTags: [
                                "type:shared",
                                "type:validation"
                            ]
                        },
                        {
                            sourceTag: "type:shared",
                            onlyDependOnLibsWithTags: [
                                "type:shared"
                            ]
                        }
                    ]
                }
            ]
        }
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.cts",
            "**/*.mts",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        // Override or add rules here
        rules: {}
    }
];
