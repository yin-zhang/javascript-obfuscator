import 'reflect-metadata';

import { assert } from 'chai';

import * as estraverse from 'estraverse';
import * as ESTree from 'estree';

import { ServiceIdentifiers } from '../../../../src/container/ServiceIdentifiers';
import { InversifyContainerFacade } from '../../../../src/container/InversifyContainerFacade';

import { IInversifyContainerFacade } from '../../../../src/interfaces/container/IInversifyContainerFacade';
import { INodeTransformer } from '../../../../src/interfaces/node-transformers/INodeTransformer';

import { NodeTransformer } from '../../../../src/enums/node-transformers/NodeTransformer';
import { NodeFactory } from '../../../../src/node/NodeFactory';
import { NodeUtils } from '../../../../src/node/NodeUtils';
import { TransformationStage } from '../../../../src/enums/node-transformers/TransformationStage';

describe('ScopeTransformer', () => {
    describe('transformNode', () => {
        let inversifyContainerFacade: IInversifyContainerFacade,
            scopeTransformer: INodeTransformer;

        before(() => {
            inversifyContainerFacade = new InversifyContainerFacade();
            inversifyContainerFacade.load('', {});

            scopeTransformer = inversifyContainerFacade
                .getNamed(ServiceIdentifiers.INodeTransformer, NodeTransformer.ScopeTransformer);
        });

        describe('Variant #1: `scope` property', () => {
            const identifierNode1: ESTree.Identifier = NodeFactory.identifierNode('foo');
            const identifierNode2: ESTree.Identifier = NodeFactory.identifierNode('bar');
            const expressionNode: ESTree.Expression = NodeFactory.binaryExpressionNode(
                '+',
                identifierNode1,
                identifierNode2
            );
            const expressionStatementNode: ESTree.ExpressionStatement = NodeFactory.expressionStatementNode(
                expressionNode
            );
            const functionBlockStatementNode: ESTree.BlockStatement = NodeFactory.blockStatementNode([
                expressionStatementNode
            ]);
            const functionDeclarationNode: ESTree.FunctionDeclaration = NodeFactory.functionDeclarationNode(
                'func',
                [],
                functionBlockStatementNode
            );
            const programNode: ESTree.Program = NodeFactory.programNode([
                functionDeclarationNode
            ]);

            before(() => {
                NodeUtils.parentizeAst(programNode);
                scopeTransformer.analyzeNode!(programNode, programNode.parentNode || null);

                estraverse.traverse(programNode, scopeTransformer.getVisitor(TransformationStage.Preparing)!);
            });

            describe('`scope` property existence', () => {
                it('Variant #1: should add `scope` property with current node scope', () => {
                    assert.property(identifierNode1, 'scope');
                });

                it('Variant #2: should add `scope` property with current node scope', () => {
                    assert.property(functionBlockStatementNode, 'scope');
                });

                it('Variant #3: should add `scope` property with current node scope', () => {
                    assert.property(functionDeclarationNode, 'scope');
                });
            });

            describe('`scope` property value', () => {
                it('Variant #1: `scope` property shouldn\'t be null', () => {
                    assert.isNotNull(identifierNode1.scope);
                });

                it('Variant #2: `scope` property shouldn\'t be null', () => {
                    assert.isNotNull(functionBlockStatementNode.scope);
                });

                it('Variant #3: `scope` property shouldn\'t be null', () => {
                    assert.isNotNull(functionDeclarationNode.scope);
                });
            });

            describe('`scope` property `block` reference', () => {
                it('Variant #1: `scope` property should contain current scope of the node', () => {
                    assert.equal(identifierNode1.scope!.block, functionDeclarationNode);
                });

                it('Variant #2: `scope` property should contain current scope of the node', () => {
                    assert.equal(functionBlockStatementNode.scope!.block, functionDeclarationNode);
                });

                it('Variant #3: `scope` property should contain current scope of the node', () => {
                    assert.equal(functionDeclarationNode.scope!.block, functionDeclarationNode);
                });
            });

            describe('`scope` property `upper` reference', () => {
                it('Variant #1: `scope` property should contain current scope of the node', () => {
                    assert.equal(identifierNode1.scope!.upper!.block, programNode);
                });

                it('Variant #2: `scope` property should contain current scope of the node', () => {
                    assert.equal(functionBlockStatementNode.scope!.upper!.block, programNode);
                });

                it('Variant #3: `scope` property should contain current scope of the node', () => {
                    assert.equal(functionDeclarationNode.scope!.upper!.block, programNode);
                });
            });
        });

        describe('Variant #2: exception when no `parentNode` property', () => {
            const identifierNode1: ESTree.Identifier = NodeFactory.identifierNode('foo');
            const identifierNode2: ESTree.Identifier = NodeFactory.identifierNode('bar');
            const expressionNode: ESTree.Expression = NodeFactory.binaryExpressionNode(
                '+',
                identifierNode1,
                identifierNode2
            );
            const expressionStatementNode: ESTree.ExpressionStatement = NodeFactory.expressionStatementNode(
                expressionNode
            );
            const functionBlockStatementNode: ESTree.BlockStatement = NodeFactory.blockStatementNode([
                expressionStatementNode
            ]);
            const functionDeclarationNode: ESTree.FunctionDeclaration = NodeFactory.functionDeclarationNode(
                'func',
                [],
                functionBlockStatementNode
            );
            const programNode: ESTree.Program = NodeFactory.programNode([
                functionDeclarationNode
            ]);

            let testFunc: () => void;

            before(() => {
                scopeTransformer.analyzeNode!(programNode, programNode.parentNode || null);

                testFunc = () => {
                    estraverse.traverse(programNode, scopeTransformer.getVisitor(TransformationStage.Preparing)!)
                };
            });

            it('Should throws an error when node hasn\'t parent node', () => {
                assert.throw(testFunc, /parentNode/);
            });
        });
    });
});